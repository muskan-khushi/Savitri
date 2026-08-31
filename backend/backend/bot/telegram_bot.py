"""
telegram_bot.py

Farmer-facing delivery layer for the irrigation advisory slice.
Flow: /irrigation -> share location -> pick crop -> enter days since
sowing -> get back the same real, computed recommendation the API
returns. No shortcuts here either: this calls the exact same
get_irrigation_recommendation() pipeline as the HTTP API, so there's
only one source of truth for the calculation.

NOT yet done (flagged honestly, matching the zero-mock-logic ethos):
  - No Bhashini vernacular translation layer yet. Responses are in
    English only until that integration is built — we are NOT faking
    Hindi/Bhojpuri output by hardcoding a couple of translated
    sentences, since that would misrepresent what's actually working.
  - No persistence — every conversation starts fresh, nothing is saved
    to a farm profile yet (pending the Supabase/Neon decision).

Setup:
  1. Create a bot via @BotFather on Telegram, get the token.
  2. Set it as an environment variable: TELEGRAM_BOT_TOKEN
  3. Run: python3 bot/telegram_bot.py
"""

from __future__ import annotations

import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from telegram import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ConversationHandler,
    ContextTypes,
    filters,
)

from app.services.irrigation_service import get_irrigation_recommendation
from app.services.weather_service import WeatherServiceError
from app.services.crop_coefficients import CROP_COEFFICIENTS
from app.services.bhashini_service import translate_text, BhashiniServiceError
from app.db import AsyncSessionLocal
from app.models_db import Farm, IrrigationLog
from sqlalchemy import select

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

LOCATION, CROP, DAYS, SOWING_DATE, USE_SAVED, LANGUAGE = range(6)

# Only languages we're offering in the bot UI — NOT a claim that
# Bhashini supports all of these for every task. Each translation call
# still goes through the real config-call check in bhashini_service.py,
# so if a specific pair isn't actually supported, the farmer gets an
# honest explanation rather than a silently-wrong or English fallback.
LANGUAGE_OPTIONS = [
    ("English (no translation)", "en"),
    ("हिंदी (Hindi)", "hi"),
    ("भोजपुरी (Bhojpuri)", "bho"),
    ("मैथिली (Maithili)", "mai"),
]


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Namaste! I'm the Savitri irrigation assistant.\n\n"
        "I'll tell you whether to irrigate today based on real weather "
        "data and your crop's actual water needs — not a guess.\n\n"
        "Type /irrigation to get today's advisory."
    )


async def irrigation_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    chat_id = str(update.effective_chat.id)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Farm).where(Farm.telegram_chat_id == chat_id))
        farm = result.scalar_one_or_none()

    if farm is not None:
        context.user_data["existing_farm_id"] = farm.id
        das = farm.days_after_sowing()
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("Yes, use this farm", callback_data="use_saved")],
            [InlineKeyboardButton("No, set up a new one", callback_data="new_farm")],
        ])
        await update.message.reply_text(
            f"I have a saved farm for you: {farm.crop.title()}, sown {das} days ago "
            f"at ({farm.lat:.3f}, {farm.lon:.3f}).\n\nUse this one?",
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
        context.user_data.pop("existing_farm_id", None)
        return await _ask_location(update, context)

    # use_saved: ask language before computing
    return await _ask_language(update, context)


async def location_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    loc = update.message.location
    if loc is None:
        await update.message.reply_text(
            "I need your location to fetch real weather data — please use the "
            "'Share my farm's location' button."
        )
        return LOCATION

    context.user_data["lat"] = loc.latitude
    context.user_data["lon"] = loc.longitude

    crop_buttons = [
        [InlineKeyboardButton(crop.title(), callback_data=crop)]
        for crop in CROP_COEFFICIENTS.keys()
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
        f"Crop: {query.data.title()}.\n\nWhat date was it sown/transplanted? "
        f"(format: YYYY-MM-DD, e.g. 2026-07-01)"
    )
    return SOWING_DATE


async def _ask_language(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    target = update.message or update.callback_query.message
    buttons = [[InlineKeyboardButton(label, callback_data=code)] for label, code in LANGUAGE_OPTIONS]
    await target.reply_text(
        "Which language should I reply in?",
        reply_markup=InlineKeyboardMarkup(buttons),
    )
    return LANGUAGE


async def language_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    language = query.data

    if "new_farm_id" in context.user_data:
        farm_id = context.user_data.pop("new_farm_id")
    else:
        farm_id = context.user_data["existing_farm_id"]

    async with AsyncSessionLocal() as session:
        farm = await session.get(Farm, farm_id)

    await query.edit_message_text("Checking today's real weather and running the numbers...")
    await _compute_and_reply(update, context, session_farm=farm, language=language)
    return ConversationHandler.END


async def sowing_date_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    from datetime import date as date_cls

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
            telegram_chat_id=chat_id, lat=lat, lon=lon, crop=crop, sowing_date=sowing_date
        )
        session.add(farm)
        await session.commit()
        await session.refresh(farm)

    context.user_data["new_farm_id"] = farm.id
    return await _ask_language(update, context)


async def _compute_and_reply(update, context, session_farm: Farm, language: str = "en"):
    """Runs the real advisory for a (saved or freshly created) farm, persists it, and
    optionally translates the recommendation via Bhashini. If translation fails, we
    say so explicitly and show English — never silently substitute one language for
    another without telling the farmer."""
    target = update.message or update.callback_query.message
    das = session_farm.days_after_sowing()

    try:
        rec = await get_irrigation_recommendation(
            lat=session_farm.lat, lon=session_farm.lon, crop=session_farm.crop,
            days_after_sowing=das,
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

    async with AsyncSessionLocal() as session:
        log = IrrigationLog(
            farm_id=session_farm.id, advisory_date=rec.date, t_max_c=rec.t_max_c,
            t_min_c=rec.t_min_c, precipitation_mm=rec.precipitation_mm,
            et0_mm_day=rec.et0_mm_day, kc=rec.kc, etc_mm_day=rec.etc_mm_day,
            effective_rainfall_mm=rec.effective_rainfall_mm,
            net_irrigation_mm=rec.net_irrigation_mm, should_irrigate=rec.should_irrigate,
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
                f"showing English instead. Technical detail: {e})"
            )

    reply = (
        f"📅 {rec.date} — {rec.crop.title()}, {rec.growth_stage} stage (day {das})\n"
        f"🌡️ {rec.t_min_c}°C to {rec.t_max_c}°C, rain today: {rec.precipitation_mm}mm\n\n"
        f"💧 Crop water need (ETc): {rec.etc_mm_day}mm\n"
        f"🌧️ Effective rainfall: {rec.effective_rainfall_mm}mm\n\n"
        f"👉 {recommendation_display}{translation_note}"
    )
    await target.reply_text(reply)


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Cancelled. Type /irrigation whenever you're ready.")
    return ConversationHandler.END


def build_app() -> Application:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError(
            "TELEGRAM_BOT_TOKEN environment variable not set. "
            "Get a token from @BotFather on Telegram and set it before running."
        )

    application = Application.builder().token(token).build()

    conv_handler = ConversationHandler(
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

    application.add_handler(CommandHandler("start", start))
    application.add_handler(conv_handler)
    return application


if __name__ == "__main__":
    app = build_app()
    logger.info("Savitri irrigation bot starting (polling mode)...")
    logger.info("Note: schema is managed by Alembic — run `alembic upgrade head` first if you haven't.")
    app.run_polling()
