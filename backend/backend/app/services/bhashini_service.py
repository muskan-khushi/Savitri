"""
bhashini_service.py

Real client for Bhashini (India's National Language Translation
Mission), via the ULCA pipeline APIs, for vernacular delivery of
irrigation/disease/price advisories in Hindi, Bhojpuri, Maithili, etc.

TWO-STEP FLOW, per Bhashini's own documented architecture:

  1. Pipeline Config Call (getModelsPipeline) — tells us which real
     serviceId to use for a given task+language pair, and returns the
     actual compute endpoint URL + auth header to use next. We do NOT
     hardcode the compute endpoint or a serviceId: both come from this
     call's real response, exactly as Bhashini's docs specify.

  2. Pipeline Compute Call — the actual ASR/translation/TTS inference,
     sent to whatever endpoint the config call returned.

HONEST LANGUAGE-SUPPORT HANDLING: Bhojpuri, Maithili, and Magahi do
appear in Bhashini's published language ecosystem (confirmed via
Bhashini's own site and API docs, not assumed) — but exactly which
models support which of ASR/translation/TTS for a given language
varies. This module does NOT hardcode "Bhojpuri TTS works" or similar.
Instead, `get_pipeline_config()` asks Bhashini directly, and if no
service matches the requested task+language combination, we raise
BhashiniServiceError rather than silently falling back to English or
a different language.

Credentials required (real personal credentials from the Bhashini/
ULCA developer portal — cannot be obtained on your behalf):
    BHASHINI_USER_ID
    BHASHINI_API_KEY
"""

from __future__ import annotations

import base64
import os
from dataclasses import dataclass

import httpx

CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"

# This is Bhashini's commonly-used default MeitY pipeline ID (supports
# ASR+NMT+TTS task sequences), cited across multiple independent
# integration references. Pipeline IDs are account/portal-configurable
# on Bhashini's side, so treat this as a working default to try, not
# an immutable constant — confirm against your own Bhashini dashboard
# if it stops resolving.
DEFAULT_PIPELINE_ID = "64392f96daac500b55c543cd"

# ISO-639 codes for languages relevant to Bihar farmers. Bhashini
# documents that it follows "the ISO-639 series" (mixing 639-1 and
# 639-3 as needed for languages without a two-letter code). Whether a
# given language is actually supported for a *specific* task
# (ASR vs. translation vs. TTS) is NOT asserted here — that's
# determined live by get_pipeline_config()'s real response.
LANGUAGE_CODES = {
    "hindi": "hi",
    "english": "en",
    "bhojpuri": "bho",   # ISO 639-3; confirm task-level support live
    "maithili": "mai",
    "magahi": "mag",     # confirm task-level support live
    "bengali": "bn",
    "urdu": "ur",
}


class BhashiniServiceError(RuntimeError):
    pass


@dataclass
class PipelineEndpoint:
    """What we get back from the config call: where to send the compute
    call, and the exact auth header to attach to it."""
    callback_url: str
    auth_header_name: str
    auth_header_value: str


@dataclass
class TaskServiceConfig:
    task_type: str
    service_id: str
    source_language: str
    target_language: str | None


def _get_credentials() -> tuple[str, str]:
    user_id = os.environ.get("BHASHINI_USER_ID")
    api_key = os.environ.get("BHASHINI_API_KEY")
    if not user_id or not api_key:
        raise BhashiniServiceError(
            "BHASHINI_USER_ID and/or BHASHINI_API_KEY not set. These are real "
            "personal credentials from the Bhashini/ULCA developer portal "
            "(https://bhashini.gov.in) — register there; they cannot be "
            "obtained automatically. See README for details."
        )
    return user_id, api_key


async def get_pipeline_config(
    task_type: str,
    source_language: str,
    target_language: str | None = None,
    pipeline_id: str = DEFAULT_PIPELINE_ID,
) -> tuple[TaskServiceConfig, PipelineEndpoint]:
    """
    Real config call: asks Bhashini which service can actually do
    `task_type` for this language pair, and how to call it.

    Raises BhashiniServiceError if no matching service is returned —
    this is the mechanism that prevents silently proceeding with the
    wrong language or a fabricated "it worked" when Bhashini's own
    models don't actually cover the requested combination.
    """
    user_id, api_key = _get_credentials()

    task_config: dict = {"language": {"sourceLanguage": source_language}}
    if target_language:
        task_config["language"]["targetLanguage"] = target_language

    body = {
        "pipelineTasks": [{"taskType": task_type, "config": task_config}],
        "pipelineRequestConfig": {"pipelineId": pipeline_id},
    }
    headers = {"userID": user_id, "ulcaApiKey": api_key, "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(CONFIG_URL, json=body, headers=headers)
            resp.raise_for_status()
            payload = resp.json()
    except httpx.HTTPError as e:
        raise BhashiniServiceError(f"Bhashini pipeline config call failed: {e}") from e

    # Find the service config matching our task type
    matching_task = next(
        (t for t in payload.get("pipelineResponseConfig", []) if t.get("taskType") == task_type),
        None,
    )
    if matching_task is None or not matching_task.get("config"):
        raise BhashiniServiceError(
            f"Bhashini has no '{task_type}' service for "
            f"source='{source_language}'"
            + (f", target='{target_language}'" if target_language else "")
            + f". This language/task combination is not currently supported — "
            f"not something to work around by substituting a different language."
        )

    service_entry = matching_task["config"][0]  # first matching real service
    service_config = TaskServiceConfig(
        task_type=task_type,
        service_id=service_entry["serviceId"],
        source_language=source_language,
        target_language=target_language,
    )

    # The compute endpoint + auth header are returned by Bhashini itself,
    # not hardcoded on our end — this is the documented mechanism.
    endpoint_info = payload.get("pipelineInferenceAPIEndPoint")
    if not endpoint_info:
        raise BhashiniServiceError(
            "Bhashini config response did not include pipelineInferenceAPIEndPoint — "
            "cannot determine where to send the compute call."
        )

    inference_key = endpoint_info.get("inferenceApiKey", {})
    endpoint = PipelineEndpoint(
        callback_url=endpoint_info["callbackUrl"],
        auth_header_name=inference_key.get("name", "Authorization"),
        auth_header_value=inference_key.get("value", ""),
    )

    return service_config, endpoint


async def _compute(
    task_type: str,
    service: TaskServiceConfig,
    endpoint: PipelineEndpoint,
    input_data: dict,
    extra_task_config: dict | None = None,
) -> dict:
    """Real compute call to whatever endpoint the config call returned."""
    task_config = {
        "language": {"sourceLanguage": service.source_language},
        "serviceId": service.service_id,
    }
    if service.target_language:
        task_config["language"]["targetLanguage"] = service.target_language
    if extra_task_config:
        task_config.update(extra_task_config)

    body = {
        "pipelineTasks": [{"taskType": task_type, "config": task_config}],
        "inputData": input_data,
    }
    headers = {
        "Content-Type": "application/json",
        endpoint.auth_header_name: endpoint.auth_header_value,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(endpoint.callback_url, json=body, headers=headers)
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPError as e:
        raise BhashiniServiceError(f"Bhashini compute call failed: {e}") from e


async def translate_text(text: str, source_language: str, target_language: str) -> str:
    """Real NMT translation. Raises BhashiniServiceError if the language pair isn't supported."""
    service, endpoint = await get_pipeline_config("translation", source_language, target_language)
    result = await _compute(
        "translation", service, endpoint,
        input_data={"input": [{"source": text}]},
    )
    try:
        return result["pipelineResponse"][0]["output"][0]["target"]
    except (KeyError, IndexError) as e:
        raise BhashiniServiceError(f"Unexpected Bhashini translation response shape: {e}") from e


async def text_to_speech(text: str, language: str, gender: str = "female") -> bytes:
    """
    Real TTS. Returns raw audio bytes (Bhashini returns base64-encoded
    audio; we decode it here, we do not synthesize placeholder audio).
    """
    service, endpoint = await get_pipeline_config("tts", language)
    result = await _compute(
        "tts", service, endpoint,
        input_data={"input": [{"source": text}]},
        extra_task_config={"gender": gender},
    )
    try:
        audio_b64 = result["pipelineResponse"][0]["audio"][0]["audioContent"]
        return base64.b64decode(audio_b64)
    except (KeyError, IndexError) as e:
        raise BhashiniServiceError(f"Unexpected Bhashini TTS response shape: {e}") from e


async def speech_to_text(audio_bytes: bytes, language: str, audio_format: str = "wav", sampling_rate: int = 16000) -> str:
    """Real ASR — transcribes real audio, does not fabricate a transcript."""
    service, endpoint = await get_pipeline_config("asr", language)
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
    result = await _compute(
        "asr", service, endpoint,
        input_data={"audio": [{"audioContent": audio_b64}]},
        extra_task_config={"audioFormat": audio_format, "samplingRate": sampling_rate},
    )
    try:
        return result["pipelineResponse"][0]["output"][0]["source"]
    except (KeyError, IndexError) as e:
        raise BhashiniServiceError(f"Unexpected Bhashini ASR response shape: {e}") from e
