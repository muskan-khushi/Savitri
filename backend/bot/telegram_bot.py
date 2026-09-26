"""
telegram_bot.py

Farmer-facing Telegram delivery layer for Savitri advisory services.

Conversation flows supported:
  /start       — welcome
  /irrigation  — real FAO-56 irrigation advisory with optional Bhashini translation
  /spoilage    — Q10 spoilage risk check
  /climate     — 16-day climate risk + PMFBY nudge
  /cancel      — abandon current conversation

Bhashini integration: if translation fails, the bot says so explicitly
and shows English — it never silently substitutes a different language.

Session safety: all SQLAlchemy session operations are enclosed in their
own `async with AsyncSessionLocal()` blocks. Farm objects passed between
handler steps are converted to plain dicts immediately after loading, so
there are no detached-session references between conversation steps.

Setup:
  1. Create a bot via @BotFather on Telegram, get the token.
  2. Set TELEGRAM_BOT_TOKEN environment variable.
  3. Run: python3 bot/telegram_bot.py
  4. Ensure `alembic upgrade head` has been run first.
"""

from __future__ import annotations

import logging
import os
import sys
from dataclasses import dataclass
from datetime import date as date_cls

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Load .env from backend/ directory so TELEGRAM_BOT_TOKEN etc. are available
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from telegram import (
    ReplyKeyboardMarkup, KeyboardButton,
    InlineKeyboardMarkup, InlineKeyboardButton, Update
)
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    CallbackQueryHandler, ConversationHandler, ContextTypes, filters,
)

from app.services.irrigation_service import get_irrigation_recommendation
from app.services.weather_service import WeatherServiceError
from app.services.spoilage_service import calculate_spoilage_risk
from app.services.climate_risk_service import get_climate_risk, ClimateRiskServiceError
from app.services.crop_coefficients import CROP_COEFFICIENTS
from app.services.bhashini_service import translate_text, BhashiniServiceError
from app.db import AsyncSessionLocal
from app.models_db import Farm, IrrigationLog
from sqlalchemy import select

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Conversation states
LOCATION, CROP, SOWING_DATE, USE_SAVED, LANGUAGE = range(5)
SPOILAGE_DATE = 10

LANGUAGE_OPTIONS = [
    ("English (no translation)", "en"),
    ("हिंदी (Hindi)", "hi"),
    ("भोजपुरी (Bhojpuri)", "bho"),
    ("मैथिली (Maithili)", "mai"),
]


@dataclass
class FarmSnapshot:
    """Plain-data snapshot of a Farm row — safe to hold across async boundaries
    without a live SQLAlchemy session."""
    id: int
    telegram_chat_id: str
    lat: float
    lon: float
    crop: str
    sowing_date: date_cls

    def days_after_sowing(self, as_of: date_cls | None = None) -> int:
        as_of = as_of or date_cls.today()
        return (as_of - self.sowing_date).days


async def _load_farm_snapshot(chat_id: str) -> FarmSnapshot | None:
    """Load a farm and immediately convert to a session-free snapshot."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Farm).where(Farm.telegram_chat_id == chat_id)
        )
        farm = result.scalar_one_or_none()
        if farm is None:
            return None
        return FarmSnapshot(
            id=farm.id,
            telegram_chat_id=farm.telegram_chat_id,
            lat=farm.lat,
            lon=farm.lon,
            crop=farm.crop,
            sowing_date=farm.sowing_date,
        )


async def _get_farm_snapshot_by_id(farm_id: int) -> FarmSnapshot | None:
    """Load a farm by ID and return a session-free snapshot."""
    async with AsyncSessionLocal() as session:
        farm = await session.get(Farm, farm_id)
        if farm is None:
            return None
        return FarmSnapshot(
            id=farm.id,
            telegram_chat_id=farm.telegram_chat_id or "",
            lat=farm.lat,
            lon=farm.lon,
            crop=farm.crop,
            sowing_date=farm.sowing_date,
        )


# ── /start ────────────────────────────────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Namaste! I'm Savitri — your farm's AI advisor.\n\n"
        "Commands:\n"
        "  /irrigation — today's watering advisory\n"
        "  /spoilage   — spoilage risk check\n"
        "  /climate    — 16-day climate risk\n\n"
        "All advice is computed from real live data. If data is unavailable, "
        "I'll tell you — I won't guess."
    )


# ── /irrigation conversation ──────────────────────────────────────────────────

async def irrigation_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    snapshot = await _load_farm_snapshot(chat_id)

    if snapshot is not None:
        context.user_data["farm_snapshot"] = snapshot
        das = snapshot.days_after_sowing()
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("Yes, use this farm", callback_data="use_saved")],
            [InlineKeyboardButton("No, set up a new one", callback_data="new_farm")],
        ])
        await update.message.reply_text(
            f"I have a saved farm: {snapshot.crop.title()}, sown {das} days ago "
            f"at ({snapshot.lat:.3f}, {snapshot.lon:.3f}).\n\nUse this one?",
            reply_markup=keyboard,
        )
        return USE_SAVED

    return await _ask_location(update, context)


async def _ask_location(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    button = KeyboardButton(text="Share my farm's location", request_location=True)
    keyboard = ReplyKeyboardMarkup([[button]], one_time_keyboard=True, resize_keyboard=True)
    target = update.message or update.callback_query.message
    await target.reply_text(
        "Share your farm's location so I can pull today's real weather data.",
        reply_markup=keyboard,
    )
    return LOCATION


async def use_saved_choice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "new_farm":
        context.user_data.pop("farm_snapshot", None)
        return await _ask_location(update, context)

    return await _ask_language(update, context)


async def location_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    loc = update.message.location
    if loc is None:
        await update.message.reply_text(
            "I need your location — please use the 'Share my farm's location' button."
        )
        return LOCATION

    context.user_data["lat"] = loc.latitude
    context.user_data["lon"] = loc.longitude

    # Show all supported crops
    sorted_crops = sorted(CROP_COEFFICIENTS.keys())
    crop_buttons = [
        [InlineKeyboardButton(c.title(), callback_data=c)]
        for c in sorted_crops
    ]
    await update.message.reply_text(
        "Got it. Which crop is this?",
        reply_markup=InlineKeyboardMarkup(crop_buttons),
    )
    return CROP


async def crop_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    context.user_data["crop"] = query.data
    await query.edit_message_text(
        f"Crop: {query.data.title()}.\n\n"
        "What date was it sown/transplanted? (YYYY-MM-DD, e.g. 2026-07-01)"
    )
    return SOWING_DATE


async def sowing_date_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text.strip()
    try:
        sowing_date = date_cls.fromisoformat(text)
    except ValueError:
        await update.message.reply_text("Please use YYYY-MM-DD format, e.g. 2026-07-01.")
        return SOWING_DATE

    if sowing_date > date_cls.today():
        await update.message.reply_text("That date is in the future — please recheck.")
        return SOWING_DATE

    chat_id = str(update.effective_chat.id)
    lat = context.user_data["lat"]
    lon = context.user_data["lon"]
    crop = context.user_data["crop"]

    async with AsyncSessionLocal() as session:
        farm = Farm(
            telegram_chat_id=chat_id,
            lat=lat, lon=lon,
            crop=crop, sowing_date=sowing_date,
        )
        session.add(farm)
        await session.commit()
        farm_id = farm.id

    # Load as snapshot immediately — no detached session risk
    snapshot = await _get_farm_snapshot_by_id(farm_id)
    context.user_data["farm_snapshot"] = snapshot

    return await _ask_language(update, context)


async def _ask_language(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    target = update.message or update.callback_query.message
    buttons = [
        [InlineKeyboardButton(label, callback_data=code)]
        for label, code in LANGUAGE_OPTIONS
    ]
    await target.reply_text(
        "Which language should I reply in?",
        reply_markup=InlineKeyboardMarkup(buttons),
    )
    return LANGUAGE


async def language_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    language = query.data

    snapshot: FarmSnapshot | None = context.user_data.get("farm_snapshot")
    if snapshot is None:
        await query.edit_message_text("Something went wrong — please start over with /irrigation.")
        return ConversationHandler.END

    await query.edit_message_text("Checking today's real weather and running the numbers…")
    await _compute_and_reply(update, context, snapshot=snapshot, language=language)
    return ConversationHandler.END


async def _compute_and_reply(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    snapshot: FarmSnapshot,
    language: str = "en",
) -> None:
    """
    Runs the real advisory for a FarmSnapshot (session-free), persists
    the log, and optionally translates via Bhashini. If translation
    fails, tells the farmer explicitly rather than silently using English.
    """
    target = update.message or update.callback_query.message
    das = snapshot.days_after_sowing()

    try:
        rec = await get_irrigation_recommendation(
            lat=snapshot.lat, lon=snapshot.lon,
            crop=snapshot.crop, days_after_sowing=das,
        )
    except WeatherServiceError as e:
        await target.reply_text(
            "I couldn't fetch real weather data for your location right now, so I "
            "won't guess an irrigation recommendation. Please try again in a bit.\n\n"
            f"(Technical detail: {e})"
        )
        return
    except ValueError as e:
        await target.reply_text(f"Something's off with that input: {e}")
        return

    # Persist log — fresh session, no detached object risk
    async with AsyncSessionLocal() as session:
        log = IrrigationLog(
            farm_id=snapshot.id,
            advisory_date=rec.date,
            t_max_c=rec.t_max_c, t_min_c=rec.t_min_c,
            precipitation_mm=rec.precipitation_mm,
            et0_mm_day=rec.et0_mm_day, kc=rec.kc,
            etc_mm_day=rec.etc_mm_day,
            effective_rainfall_mm=rec.effective_rainfall_mm,
            net_irrigation_mm=rec.net_irrigation_mm,
            should_irrigate=rec.should_irrigate,
            recommendation_text=rec.recommendation_text,
        )
        session.add(log)
        await session.commit()

    recommendation_display = rec.recommendation_text
    translation_note = ""
    if language != "en":
        try:
            recommendation_display = await translate_text(rec.recommendation_text, "en", language)
        except BhashiniServiceError as e:
            translation_note = (
                f"\n\n(Couldn't translate into your chosen language right now, "
                f"showing English instead. Detail: {e})"
            )

    reply = (
        f"📅 {rec.date} — {rec.crop.title()}, {rec.growth_stage} stage (day {das})\n"
        f"🌡️ {rec.t_min_c}°C to {rec.t_max_c}°C, rain today: {rec.precipitation_mm}mm\n\n"
        f"💧 Crop water need (ETc): {rec.etc_mm_day}mm\n"
        f"🌧️ Effective rainfall: {rec.effective_rainfall_mm}mm\n\n"
        f"👉 {recommendation_display}{translation_note}"
    )
    await target.reply_text(reply)


# ── /spoilage conversation ────────────────────────────────────────────────────

async def spoilage_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)
    snapshot = await _load_farm_snapshot(chat_id)

    if snapshot is None:
        await update.message.reply_text(
            "Add your farm first with /irrigation, then I'll be able to "
            "compute spoilage risk for your crop."
        )
        return ConversationHandler.END

    context.user_data["farm_snapshot"] = snapshot
    await update.message.reply_text(
        f"Crop: {snapshot.crop.title()}.\n\n"
        "When was it harvested? (YYYY-MM-DD, e.g. 2026-09-15)"
    )
    return SPOILAGE_DATE


async def spoilage_date_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text.strip()
    try:
        harvest = date_cls.fromisoformat(text)
    except ValueError:
        await update.message.reply_text("Please use YYYY-MM-DD format.")
        return SPOILAGE_DATE

    snapshot: FarmSnapshot = context.user_data["farm_snapshot"]
    days_since = (date_cls.today() - harvest).days

    if days_since < 0:
        await update.message.reply_text("That date is in the future — please recheck.")
        return SPOILAGE_DATE

    try:
        from app.services.weather_service import fetch_daily_weather
        weather = await fetch_daily_weather(snapshot.lat, snapshot.lon)
        avg_temp = (weather.t_max_c + weather.t_min_c) / 2
        result = calculate_spoilage_risk(snapshot.crop, days_since, avg_temp)
    except WeatherServiceError as e:
        await update.message.reply_text(f"Couldn't fetch weather data: {e}")
        return ConversationHandler.END
    except ValueError as e:
        await update.message.reply_text(f"Error: {e}")
        return ConversationHandler.END

    emoji = {"low": "🟢", "medium": "🟡", "high": "🔴"}.get(result.risk_level, "⚠️")
    await update.message.reply_text(
        f"{emoji} {result.risk_level.upper()} spoilage risk\n\n"
        f"{result.recommendation_text}\n\n"
        f"_Day {days_since} of {result.effective_shelf_life_days:.1f}-day effective shelf life._\n\n"
        f"Note: {result.note}"
    )
    return ConversationHandler.END


# ── /climate command ──────────────────────────────────────────────────────────

async def climate_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = str(update.effective_chat.id)
    snapshot = await _load_farm_snapshot(chat_id)

    if snapshot is None:
        await update.message.reply_text(
            "Add your farm first with /irrigation, then I can check climate risk."
        )
        return

    await update.message.reply_text("Fetching 16-day climate forecast…")

    try:
        result = await get_climate_risk(snapshot.lat, snapshot.lon, snapshot.crop)
    except ClimateRiskServiceError as e:
        await update.message.reply_text(
            f"Couldn't fetch climate forecast right now: {e}"
        )
        return

    drought_bar = "🟩" * max(0, 5 - int(result.drought_index * 5)) + "🟥" * int(result.drought_index * 5)
    pmfby_line = (
        f"\n\n🛡️ *Enroll in PMFBY insurance* — {result.pmfby_reason}"
        if result.pmfby_nudge else ""
    )

    await update.message.reply_text(
        f"🌤 *Climate Risk — next {result.forecast_days} days*\n\n"
        f"☔ Forecast rain: {result.total_forecast_precip_mm:.1f}mm\n"
        f"💧 Crop demand (ET₀): {result.total_forecast_et0_mm:.1f}mm\n\n"
        f"🏜️ Drought risk: {result.drought_risk_level.upper()} {drought_bar}\n"
        f"🌡️ Heat stress: {result.heat_stress_level.upper()} ({result.heat_stress_gdd:.0f} GDD > {result.heat_threshold_used_c:.0f}°C)\n\n"
        f"👉 {result.recommendation_text}{pmfby_line}",
        parse_mode="Markdown",
    )


# ── /cancel ───────────────────────────────────────────────────────────────────

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Cancelled. Type /irrigation, /spoilage, or /climate whenever you're ready.")
    return ConversationHandler.END


# ── App assembly ──────────────────────────────────────────────────────────────

def build_app() -> Application:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError(
            "TELEGRAM_BOT_TOKEN not set. Get a token from @BotFather on Telegram."
        )

    application = Application.builder().token(token).build()

    irrigation_conv = ConversationHandler(
        entry_points=[CommandHandler("irrigation", irrigation_start)],
        states={
            USE_SAVED: [CallbackQueryHandler(use_saved_choice)],
            LOCATION: [MessageHandler(filters.LOCATION, location_received)],
            CROP: [CallbackQueryHandler(crop_received)],
            SOWING_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, sowing_date_received)],
            LANGUAGE: [CallbackQueryHandler(language_received)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    spoilage_conv = ConversationHandler(
        entry_points=[CommandHandler("spoilage", spoilage_start)],
        states={
            SPOILAGE_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, spoilage_date_received)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("climate", climate_cmd))
    application.add_handler(irrigation_conv)
    application.add_handler(spoilage_conv)
    return application


if __name__ == "__main__":
    app = build_app()
    logger.info("Savitri bot starting (polling mode)…")
    logger.info("Note: run `alembic upgrade head` before starting if you haven't.")
    app.run_polling()
