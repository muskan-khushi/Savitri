"use client";

/**
 * Crop Health — wired to POST /api/v1/disease-detection.
 * Uploads a leaf photo, gets a real MobileNetV2 diagnosis.
 * The 503 "model not trained" response is surfaced as a distinct,
 * honest UI state — never swallowed into a generic error.
 */

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { detectDisease, ApiError, type DiseasePrediction } from "@/lib/api";

type State =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; result: DiseasePrediction; fileName: string }
  | { status: "model-not-trained"; detail: string }
  | { status: "error"; detail: string };

export default function CropHealthPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: "idle" });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setState({ status: "idle" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setState({ status: "uploading" });

    try {
      const result = await detectDisease(file);
      setState({ status: "success", result, fileName: file.name });
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setState({ status: "model-not-trained", detail: err.detail ?? err.message });
      } else {
        setState({
          status: "error",
          detail: err instanceof ApiError ? (err.detail ?? err.message) : String(err),
        });
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Crop Health</h1>
      <p className="mt-1 text-soil/60">
        Upload a leaf photo — real MobileNetV2 diagnosis, or an honest &quot;not ready.&quot;
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        {/* Upload area */}
        <label
          htmlFor="leaf-upload"
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-soil/20 bg-wheat/10 p-10 cursor-pointer hover:border-terracotta/40 hover:bg-wheat/20 transition-colors"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Selected leaf"
              className="max-h-48 rounded-xl object-contain"
            />
          ) : (
            <>
              <span className="text-4xl">🌿</span>
              <span className="text-sm text-soil/60 text-center">
                Click to select a leaf photo
                <br />
                <span className="text-xs text-soil/40">JPG, PNG, WEBP · any crop</span>
              </span>
            </>
          )}
          <input
            id="leaf-upload"
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>

        {preview && (
          <Button
            type="submit"
            disabled={state.status === "uploading"}
            className="mt-4 w-full"
          >
            {state.status === "uploading" ? "Analysing…" : "Diagnose this leaf"}
          </Button>
        )}
      </form>

      {/* Results */}
      <div className="mt-6">
        {state.status === "success" && (
          <div
            className={`rounded-2xl border p-6 ${
              state.result.is_healthy
                ? "border-green-200 bg-green-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p
              className={`text-lg font-semibold ${
                state.result.is_healthy ? "text-green-800" : "text-amber-800"
              }`}
            >
              {state.result.is_healthy ? "✅ Healthy" : `⚠️ ${state.result.condition}`}
            </p>
            <p className="mt-1 text-sm text-soil/70">
              Crop: <span className="font-medium">{state.result.crop}</span> ·
              Confidence: <span className="font-medium">{(state.result.confidence * 100).toFixed(1)}%</span>
            </p>

            <div className="mt-4">
              <p className="text-xs font-medium text-soil/50 mb-2">Top 5 predictions</p>
              <div className="space-y-1.5">
                {state.result.top5.map(([cls, prob], i) => (
                  <div key={cls} className="flex items-center gap-2">
                    <div className="w-full rounded-full bg-soil/10 h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-terracotta/60 rounded-full"
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-soil/60 whitespace-nowrap w-48 shrink-0">
                      {i + 1}. {cls.replace(/_/g, " ")} ({(prob * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs text-soil/40">
              MobileNetV2 · PlantVillage dataset · {state.fileName}
            </p>
          </div>
        )}

        {state.status === "model-not-trained" && (
          <div className="rounded-2xl border border-soil/20 bg-wheat/30 p-6">
            <p className="font-semibold text-soil">Model not trained yet (503)</p>
            <p className="mt-2 text-sm text-soil/70">
              The disease-detection model has no checkpoint — it will not fabricate a
              diagnosis from an untrained network. Train it first:
            </p>
            <code className="mt-3 block text-xs bg-soil/5 rounded-lg p-3 text-soil/60">
              python ml/train_disease_model.py
            </code>
            <p className="mt-3 text-xs text-soil/40 break-all">{state.detail}</p>
          </div>
        )}

        {state.status === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">Upload failed</p>
            <p className="mt-2 text-sm text-red-700">{state.detail}</p>
          </div>
        )}
      </div>
    </div>
  );
}
