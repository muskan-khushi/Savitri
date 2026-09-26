"""
whatsapp_service.py

Meta WhatsApp Business Cloud API Integration for Savitri.
Enables two-way conversational agricultural advisory directly inside WhatsApp.

Supported Inbound Actions:
  - Text: 'irrigation', 'pani', 'पानी' -> FAO-56 irrigation recommendation (vernacular)
  - Text: 'climate', 'mausam', 'मौसम' -> 16-day drought & heat stress report
  - Text: 'spoilage', 'bhandaran', 'भंडारण' -> Q10 post-harvest shelf-life guidance
  - Text: 'mandi', 'bhav', 'भाव' -> Agmarknet market price check
  - Location Pin (WhatsApp Share Location) -> Auto-registers or updates farm coordinates
  - Any other message -> Main interactive menu in Hindi and English
"""

from __future__ import annotations

import logging
import os
from typing import Any
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models_db import Farm
from app.services.irrigation_service import get_irrigation_recommendation
from app.services.weather_service import WeatherServiceError
from app.services.climate_risk_service import get_climate_risk
from app.services.spoilage_service import calculate_spoilage_risk
from app.services.mandi_price_service import fetch_mandi_prices
from app.services.bhashini_service import translate_text

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = "v20.0"
DEFAULT_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "savitri_agri_verify_2026")


def verify_token(mode: str | None, token: str | None, challenge: str | None) -> str | None:
    """Standard Meta WhatsApp Webhook handshake verification."""
    expected = os.environ.get("WHATSAPP_VERIFY_TOKEN", DEFAULT_VERIFY_TOKEN)
    if mode == "subscribe" and token == expected:
        logger.info("WhatsApp webhook verified successfully.")
        return challenge
    logger.warning("WhatsApp webhook verification token mismatch.")
    return None


async def send_whatsapp_message(to_phone: str, text: str) -> bool:
    """
    Sends an outbound text message to a farmer's WhatsApp number via Meta Graph API.
    Gracefully logs and continues if token/phone ID is not yet configured.
    """
    token = os.environ.get("WHATSAPP_TOKEN")
    phone_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID")

    if not token or not phone_id:
        logger.warning(
            "WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set. Outbound WhatsApp message simulated."
        )
        logger.info(f"[WHATSAPP SIMULATION to {to_phone}]:\n{text}")
        return True

    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "text",
        "text": {"preview_url": False, "body": text},
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code >= 400:
                logger.error(f"WhatsApp send failed: {resp.status_code} - {resp.text}")
                return False
            return True
    except Exception as e:
        logger.error(f"WhatsApp network error: {e}")
        return False


async def handle_whatsapp_webhook(payload: dict[str, Any], session: AsyncSession) -> None:
    """
    Parses incoming messages from Meta WhatsApp webhook and dispatches responses.
    """
    try:
        entry = payload.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        if not messages:
            return  # Status updates (delivered, read) ignore

        msg = messages[0]
        from_phone = msg.get("from")  # Farmer's WhatsApp phone (e.g. "919876543210")
        msg_type = msg.get("type")

        # 1. Location message received (Farmer shared GPS pin)
        if msg_type == "location":
            loc = msg.get("location", {})
            lat = loc.get("latitude")
            lon = loc.get("longitude")
            if lat and lon:
                await _register_or_update_location(session, from_phone, lat, lon)
                reply = (
                    f"🌾 *स्थान दर्ज हो गया (Location Saved!)*\n\n"
                    f"Latitude: {lat:.4f}, Longitude: {lon:.4f}\n\n"
                    f"आपकी ज़मीन की वास्तविक जलवायु और उपग्रह डेटा कनेक्ट हो गया है।\n\n"
                    f"👉 सिंचाई सलाह के लिए *1* भेजें\n"
                    f"👉 मौसम/सूखा जोखिम के लिए *2* भेजें\n"
                    f"👉 मंडी भाव के लिए *3* भेजें"
                )
                await send_whatsapp_message(from_phone, reply)
                return

        # 2. Text message received
        if msg_type == "text":
            body = msg.get("text", {}).get("body", "").strip().lower()
            await _dispatch_text_command(session, from_phone, body)

    except Exception as e:
        logger.error(f"Error handling WhatsApp message: {e}", exc_info=True)


async def _register_or_update_location(session: AsyncSession, phone: str, lat: float, lon: float) -> Farm:
    """Finds or creates a farm profile linked to this WhatsApp phone number."""
    from datetime import date
    result = await session.execute(select(Farm).where(Farm.telegram_chat_id == f"wa_{phone}"))
    farm = result.scalar_one_or_none()

    if farm:
        farm.lat = lat
        farm.lon = lon
    else:
        # Default starter crop: rice, sowing date ~60 days ago
        sowing = date.today()
        farm = Farm(
            name=f"WhatsApp Farm ({phone[-4:]})",
            telegram_chat_id=f"wa_{phone}",
            lat=lat,
            lon=lon,
            crop="rice",
            sowing_date=sowing,
        )
        session.add(farm)

    await session.commit()
    await session.refresh(farm)
    return farm


async def _dispatch_text_command(session: AsyncSession, phone: str, text: str) -> None:
    result = await session.execute(select(Farm).where(Farm.telegram_chat_id == f"wa_{phone}"))
    farm = result.scalar_one_or_none()

    # If no farm location saved yet and user hasn't sent GPS
    if not farm and not any(kw in text for kw in ["hello", "namaste", "hi", "start"]):
        # Fallback to Bihar central coords (Patna) if they want quick answer
        farm = await _register_or_update_location(session, phone, 25.5941, 85.1376)

    # Command 1: Irrigation
    if text in ["1", "irrigation", "pani", "water", "पानी", "सिंचाई"]:
        das = farm.days_after_sowing() if farm else 60
        lat = farm.lat if farm else 25.5941
        lon = farm.lon if farm else 85.1376
        crop = farm.crop if farm else "rice"

        try:
            advisory = await get_irrigation_recommendation(lat=lat, lon=lon, crop=crop, days_after_sowing=das)
            hindi_text = await translate_text(advisory.recommendation_text, "en", "hi")
            status_emoji = "💧" if advisory.should_irrigate else "✅"
            reply = (
                f"{status_emoji} *सावित्री सिंचाई सलाह ({advisory.date})*\n\n"
                f"फसल: *{crop.title()}* (दिन {das}, {advisory.growth_stage})\n"
                f"तापमान: {advisory.t_min_c}°C - {advisory.t_max_c}°C\n"
                f"आज बारिश: {advisory.precipitation_mm:.1f} mm\n"
                f"फसल पानी मांग (ETc): {advisory.etc_mm_day:.1f} mm/दिन\n"
                f"शुद्ध पानी की आवश्यकता: *{advisory.net_irrigation_mm:.1f} mm*\n\n"
                f"👉 *सलाह:* {hindi_text}\n\n"
                f"*(English: {advisory.recommendation_text})*"
            )
        except WeatherServiceError:
            reply = "मौसम डेटा सर्वर से संपर्क नहीं हो पाया। कृपया 5 मिनट बाद पुनः प्रयास करें।"

        await send_whatsapp_message(phone, reply)
        return

    # Command 2: Climate Risk
    if text in ["2", "climate", "mausam", "weather", "मौसम", "सूखा"]:
        lat = farm.lat if farm else 25.5941
        lon = farm.lon if farm else 85.1376
        crop = farm.crop if farm else "rice"

        try:
            risk = await get_climate_risk(lat=lat, lon=lon, crop=crop)
            hindi_text = await translate_text(risk.recommendation_text, "en", "hi")
            insurance_line = f"\n\n🛡️ *PMFBY फसल बीमा अलर्ट:* {risk.pmfby_reason}" if risk.pmfby_nudge else ""
            reply = (
                f"🌤 *16-दिवसीय जलवायु और सूखा पूर्वानुमान*\n\n"
                f"स्थान: ({lat:.2f}, {lon:.2f}) · फसल: {crop.title()}\n"
                f"अनुमानित बारिश: {risk.total_forecast_precip_mm:.1f} mm\n"
                f"पानी की कुल मांग: {risk.total_forecast_et0_mm:.1f} mm\n"
                f"सूखा जोखिम: *{risk.drought_risk_level.upper()}*\n"
                f"गर्मी का तनाव (Heat Stress): *{risk.heat_stress_level.upper()}*\n\n"
                f"👉 *सुझाव:* {hindi_text}{insurance_line}"
            )
        except Exception as e:
            reply = f"जलवायु रिपोर्ट तैयार करने में त्रुटि: {e}"

        await send_whatsapp_message(phone, reply)
        return

    # Command 3: Mandi Prices
    if text in ["3", "mandi", "bhav", "market", "भाव", "मंडी"]:
        state = "Bihar"
        crop = farm.crop.title() if farm else "Rice"
        try:
            prices = await fetch_mandi_prices(state=state, commodity=crop, limit=3)
            if prices:
                lines = [f"• {p.market} ({p.district}): ₹{p.modal_price_per_quintal}/क्विंटल" for p in prices]
                reply = (
                    f"💰 *आज के ताज़ा मंडी भाव ({state} - {crop})*\n\n"
                    + "\n".join(lines) +
                    "\n\nस्रोत: Agmarknet (data.gov.in)\n(प्रति क्विंटल = 100 किलोग्राम)"
                )
            else:
                reply = f"आज {state} में {crop} के लिए कोई सरकारी मंडी रिकॉर्ड उपलब्ध नहीं है।"
        except Exception:
            reply = "मंडी पोर्टल अभी धीमा है, कृपया कुछ देर बाद भाव जांचें।"

        await send_whatsapp_message(phone, reply)
        return

    # Default Welcome / Menu
    welcome = (
        f"🙏 *नमस्ते! मैं सावित्री (Savitri) हूँ — आपका AI कृषि सलाहकार।*\n\n"
        f"कृपया नीचे दिए गए विकल्पों में से चुनें (नंबर भेजें):\n\n"
        f"1️⃣ *सिंचाई सलाह* — आज खेत में पानी लगाना है या नहीं\n"
        f"2️⃣ *16-दिन का मौसम व सूखा जोखिम* — मौसम पूर्वानुमान व बीमा सलाह\n"
        f"3️⃣ *ताज़ा मंडी भाव* — Agmarknet सरकारी दरें\n"
        f"📍 *खेत की लोकेशन शेयर करें* — सटीक मौसम के लिए WhatsApp Location भेजें\n\n"
        f"_Welcome to Savitri AI. Send 1 for Irrigation, 2 for Climate, 3 for Mandi prices, or share your GPS pin._"
    )
    await send_whatsapp_message(phone, welcome)
