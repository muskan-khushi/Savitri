# Savitri Backend — Vertical Slice #1: Irrigation Advisory

This is the first working slice of the Savitri backend, built to prove
the hardest, most unfamiliar piece of the system before anything is
built around it: **a real FAO-56 Penman-Monteith irrigation calculation
fed by live weather data.**

No mocked numbers anywhere in this path — per the zero-mock-logic
policy, if we don't have real data, the API fails loudly (502) instead
of guessing.

## What's actually real here

- **Weather**: live daily data from [Open-Meteo](https://open-meteo.com)
  (no API key needed) — temp max/min, humidity max/min, wind, solar
  radiation, precipitation, and elevation.
- **ET0 (reference evapotranspiration)**: the full FAO-56
  Penman-Monteith equation, implemented from the governing equations
  in FAO Irrigation and Drainage Paper 56 — saturation vapor pressure,
  psychrometric constant, extraterrestrial radiation (astronomical,
  computed from latitude + day-of-year), clear-sky radiation, net
  radiation, the works. See `app/services/evapotranspiration.py` for
  equation-by-equation comments.
- **Crop coefficients (Kc)**: real published values from FAO-56 Table
  12, for 8 crops relevant to Bihar/North India (rice, wheat, maize,
  sugarcane, potato, cotton, chickpea, mustard), with linear
  interpolation between growth stages per FAO-56 section 6.4.
- **Effective rainfall**: the USDA Soil Conservation Service formula,
  not "assume all rain is usable."

## Known simplifications (flagged honestly, not hidden)

- **G (soil heat flux) = 0**: standard FAO-56 simplification for daily
  timestep calculations (section 3.5) — not something we invented.
- **Kc values are for sub-humid climate conditions** as published;
  FAO-56 section 6.3 has formulas to adjust Kc_mid/Kc_end for climates
  that differ significantly (very dry/windy or very humid/still). Not
  yet applied — worth adding before this goes to farmers in, say,
  Rajasthan vs. coastal Bihar.
- **Growth stage calendars are FAO-56's generic stage-day defaults**,
  not adjusted for local variety or sowing conditions. A real system
  should let farmers (or extension data) refine sowing date and
  variety-specific durations.
- **Irrigation threshold (3mm/day)** in `irrigation_service.py` is a
  placeholder decision rule, not a published constant — flagged in
  code. Worth validating against local agronomic guidance or an FPO
  partner before treating it as authoritative.

## Validated

`tests/test_evapotranspiration.py` includes:
- physical sanity checks (hotter → higher ET0, more humid → lower ET0,
  windier → higher ET0) — all passing
- a cross-check against FAO-56's own published worked example
  (Example 18, Bangkok) — result lands in the expected ~5.7mm/day
  range

Run them:
```bash
python3 tests/test_evapotranspiration.py
```

## Setup (virtual environment)

```bash
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Everything below assumes the venv is activated.

## Database migrations (Alembic)

Schema is now managed by real Alembic migrations, not `create_all()`
on startup. That auto-create approach was flagged as debt earlier in
this README — done now, before any real farmer data exists to be put
at risk by a blunt schema change.

```bash
alembic upgrade head    # apply all migrations — run this before starting the app
```

The initial migration (`migrations/versions/..._initial_schema_*.py`)
was generated with `alembic revision --autogenerate` directly against
the real `Farm`, `IrrigationLog`, and `ColdStorage` models — not
hand-written, so it can't drift from what the ORM actually expects.

**Verified directly, not just configured and assumed correct:**
- `alembic upgrade head` against a fresh DB creates exactly the three
  real tables + both real indexes the models define — confirmed by
  querying `sqlite_master` directly afterward, not by trusting the
  Alembic log output alone
- Wrote a real row through the ORM (`Farm`) against the
  migration-created schema, confirmed it persists correctly — proving
  the migrated schema is genuinely usable by the app, not just
  structurally present
- `alembic downgrade base` cleanly removes all three tables — verified
  by re-querying `sqlite_master` and confirming they're gone
- Ran the actual FastAPI server against a purely migration-created
  database (startup no longer calls `create_all()` at all) and
  confirmed `POST /api/v1/farms` + `GET /api/v1/farms/{id}` both work
  correctly over real HTTP

Going forward: schema changes go through `alembic revision
--autogenerate -m "description"`, review the generated migration
(autogenerate is a good first draft, not infallible — always read
what it produced), then `alembic upgrade head`.

Setup (one-time), assuming you've already installed requirements:
```bash
alembic upgrade head
```

## Running the API

```bash
uvicorn app.main:app --reload --port 8000
```

Then:
```bash
curl -X POST http://localhost:8000/api/v1/irrigation-advisory \
  -H "Content-Type: application/json" \
  -d '{"lat": 25.6, "lon": 85.1, "crop": "rice", "days_after_sowing": 45}'
```

Interactive API docs: http://localhost:8000/docs

**Note on network access**: this was built and tested in a sandboxed
environment that couldn't reach `api.open-meteo.com` directly (network
allowlist restriction on the build container, confirmed with a 403).
The code path is fully wired and the error handling was verified to
fail cleanly rather than silently — but you should run one real live
request on your own machine as the actual end-to-end confirmation.

## Persistence (Postgres/Supabase in production, SQLite for local dev)

Two tables, wired via async SQLAlchemy (`app/db.py`, `app/models_db.py`):

- **`farms`** — a farmer's plot: location, crop, sowing date. `sowing_date`
  is stored once; days-after-sowing is *computed* from it on every
  request (`Farm.days_after_sowing()`), never re-typed by the caller.
- **`irrigation_logs`** — one row per advisory actually computed and
  shown to a farmer. Every column is a real number that came out of the
  FAO-56 pipeline — a failed weather fetch produces **zero** log rows,
  verified directly (see Verified section below), not just asserted in
  a comment.

**Database decision**: Supabase (hosted Postgres) for production — chosen
over Neon because you'll also want its Auth and dashboard for the
operator view and farmer/FPO logins later, and it's still portable
standard Postgres underneath if that judgment call needs revisiting.

**Local dev**: if `DATABASE_URL` isn't set, the app falls back to a
local SQLite file (`savitri_dev.db`). This is a storage-engine
convenience for development only — the *data* it stores is always real
(real coordinates, real computed values). Don't deploy with SQLite:
it won't handle concurrent access, and PostGIS (needed once the
cold-storage matching slice does "nearest N" distance queries) requires
real Postgres.

New endpoints:
```
POST /api/v1/farms                              # create a farm profile
GET  /api/v1/farms/{farm_id}                    # fetch a farm
POST /api/v1/farms/{farm_id}/irrigation-advisory # real advisory + persists to history
GET  /api/v1/farms/{farm_id}/history             # past advisories for a farm
```

To point at real Supabase Postgres instead of the SQLite fallback:
```bash
export DATABASE_URL="postgresql+asyncpg://postgres:[password]@[host]:5432/postgres"
```

**Known simplification, flagged not hidden**: `lat`/`lon` are plain
float columns, not a PostGIS `geography` type. Fine for storing and
looking up a single farm's point; will need migrating to PostGIS once
the cold-storage slice needs proper "nearest N farms/warehouses"
spatial queries. Table creation currently uses `create_all()` on
startup rather than Alembic migrations — acceptable pre-launch, but
replace with real migrations before there's farmer data in production
that a blunt schema change could clobber.

## Telegram bot (farmer-facing delivery)

`bot/telegram_bot.py` wraps the exact same `get_irrigation_recommendation()`
pipeline the API uses — one source of truth for the calculation, two
delivery channels. It now also uses the persistence layer:

- **First-time farmer**: `/irrigation` → shares location (real Telegram
  location share) → picks crop from a button list → enters sowing date
  → farm profile is saved, advisory is computed and logged.
- **Returning farmer**: `/irrigation` → bot recognizes their Telegram
  chat ID, offers "use this saved farm?" → if yes, skips straight to
  computing a fresh real advisory using today's date and the stored
  sowing date (no re-entering anything).

This lookup-by-chat-id path was verified directly against a real DB
(see Verified section) — confirmed a first-time chat finds nothing,
and a returning chat finds its saved farm with the right computed
days-after-sowing.

Setup:
```bash
export TELEGRAM_BOT_TOKEN="your-token-here"
python3 bot/telegram_bot.py
```

Verified in this build environment: the bot module imports cleanly and
`build_app()` wires all handlers correctly with a dummy token. Actually
polling Telegram's servers wasn't tested here (this sandbox's network
allowlist doesn't include Telegram's API either) — run it live on your
machine to confirm end-to-end, same caveat as Open-Meteo above.

**Honestly flagged, not yet done**: responses are English-only. No
Bhashini vernacular translation layer yet — that's a real integration
to build, not something to fake with a couple of hardcoded Hindi
sentences.

## Verified

`tests/test_evapotranspiration.py` — 6 tests, all passing, including a
cross-check against FAO-56's own published worked example.

Persistence layer, verified live in this build (not just written and
assumed correct):
- Started the real FastAPI server, created a real farm via `POST
  /api/v1/farms`, confirmed it round-tripped through Postgres-flavored
  SQLAlchemy (SQLite backend here) with a real assigned ID
- Confirmed a farm persists and can be fetched back across a fresh
  server process (proving the DB file, not just in-memory state, is
  doing the work)
- Triggered a real advisory against a saved farm, confirmed the 502
  from a blocked weather fetch propagates honestly *and* confirmed
  history stayed empty afterward — a failed advisory does not produce
  a fake logged entry
- Directly verified `Farm.days_after_sowing()` computes correctly from
  a stored date (57 days between 2026-07-01 and 2026-08-27)
- Directly verified the exact chat-ID lookup query the bot's returning-
  farmer flow depends on, against a real DB, both before and after a
  farm is saved

## Disease detection (MobileNetV2 / PlantVillage)

`app/services/disease_detection.py` — real transfer-learning
architecture (ImageNet-pretrained MobileNetV2, classifier head resized
to PlantVillage's 38 real classes), served via `POST
/api/v1/disease-detection` (multipart image upload).

**The critical safety property, verified directly, not just claimed
in a comment**: if no trained checkpoint exists, the endpoint returns
a clean 503 explaining why — confirmed by actually running the server
and hitting it with a real image with no checkpoint present. It will
never fall back to a randomly-initialized network and present its
output as a real diagnosis. That failure mode would be actively
dangerous — a farmer acting on a fabricated disease call — so this
was tested as carefully as the happy path.

Also verified directly:
- the architecture outputs exactly 38 logits (tested with random-init
  weights, purely structural — never used for a real prediction)
- the real training script (`ml/train_disease_model.py`) runs its full
  loop — data loading, augmentation, train/eval, checkpoint saving —
  correctly, tested against a tiny synthetic 3-class dataset built
  only for this structural test, then deleted
- pretrained ImageNet weights and the PlantVillage dataset itself both
  live behind hosts (`download.pytorch.org`, Kaggle) not reachable
  from the sandbox this was built in — confirmed by direct attempt,
  same network-boundary pattern as Open-Meteo and Telegram above

**To actually train a usable model**: see `ml/README.md` — download
PlantVillage, run `train_disease_model.py` on your own machine/Colab,
drop the resulting checkpoint at
`ml/checkpoints/mobilenetv2_plantvillage_best.pth` (default path, or
override via `DISEASE_MODEL_CHECKPOINT` env var). No code changes
needed after that.

**Known limitation carried over honestly from the source dataset**:
PlantVillage images are lab-condition photos (clean background,
controlled lighting). Real accuracy on messy farmer phone photos will
likely be lower than validation metrics suggest — flagged in
`ml/README.md`, not something a training script can fix on its own.

## Cold storage matching (Haversine distance)

`app/services/cold_storage_service.py` — real great-circle distance
matching via `GET /api/v1/cold-storage/nearest?lat=&lon=&limit=5`.

**No fabricated facility data anywhere.** I could not find a dataset
of real Bihar cold-storage coordinates reachable from this sandbox
(`data.gov.in` isn't on its network allowlist either), and inventing
plausible-looking warehouse locations would violate the whole point of
this project. Instead:

- `scripts/import_cold_storage_csv.py` — real CSV importer, loads
  exactly what's in the file, nothing synthesized
- `data/cold_storage_template.csv` — header-only template, zero
  fabricated rows
- If the `cold_storages` table is empty, the endpoint returns a clean
  **404 explaining why**, not an empty list that could be
  misread as "nothing nearby" — verified directly over real HTTP
- The README for the import script documents exactly where to source
  real data: data.gov.in, MANAGE's published state-wise spreadsheets,
  or Bihar's own Department of Agriculture/Horticulture

**Verified directly, not just written:**
- The Haversine formula was checked against real, independently
  verifiable distances between actual Indian cities (Patna–Delhi:
  853km computed vs. ~850-870km commonly cited; Patna–Muzaffarpur:
  64km computed vs. ~60-70km expected straight-line) — this is the
  actual math being exercised against ground truth, not a synthetic
  unit test
- Full import → query pipeline tested with clearly-labeled test
  fixture rows (never shipped, deleted after the test), confirming
  correct nearest-to-farthest sorting
- The empty-table 404 path confirmed over real HTTP against the
  running server

Known simplification, same as `farms.lat/lon`: plain float columns,
Python-side distance computation. Fine for a dataset of low thousands
of facilities; migrate to PostGIS + `ST_DWithin`/KNN indexing if this
needs to scale further or needs tighter query latency.

## Mandi prices (Agmarknet via data.gov.in)

`app/services/mandi_price_service.py` — real client for the Government
of India's daily mandi price API, served via `GET
/api/v1/mandi-prices?state=&commodity=&...`.

**Exact API contract, not reconstructed from memory**: resource ID
`9ef84268-d588-465a-a308-a864a43d0070`, endpoint
`https://api.data.gov.in/resource/{resource_id}`, filter parameter
names (`filters[state.keyword]`, `filters[commodity]`, etc.) — pulled
from a source documenting the API's own Swagger contract, cross-
referenced against the official catalog page, not guessed.

**Requires a real personal API key** from data.gov.in (free
registration) via the `DATA_GOV_API_KEY` env var — I cannot obtain
this on your behalf, and the shared demo key is rate-limited and
shared across every user of the portal, so it's not something to fall
back to for anything beyond a first look.

**Data-quality handling taken directly from the API's own
documentation, not assumptions:**
- This is a **daily administrative dataset, not a live feed** — every
  response includes a note to this effect, and each record carries its
  real `arrival_date` rather than implying today's date
- Prices are reported in **rupees per quintal (100kg)**, not per kg —
  a `modal_price_per_kg` convenience property does the conversion
  explicitly, never silently
- Price fields are parsed as `Decimal`, not `float`, to avoid
  introducing binary-floating-point error into money values
- Every record gets real data-quality flags: `min_price_exceeds_max_price`,
  `modal_price_outside_min_max_range`, `missing_price_field` — flagged
  for review, never silently corrected or discarded

**Verified directly** (everything short of the actual live API call,
same network-boundary pattern as Open-Meteo/Telegram/PyTorch above —
`api.data.gov.in` isn't reachable from this sandbox either, confirmed
by direct attempt):
- Decimal parsing against real and malformed price strings
- Date parsing against AGMARKNET's actual `DD/MM/YYYY` format
- All three data-quality checks, tested against deliberately-broken
  synthetic values (min > max, modal outside range)
- Quintal-to-kg conversion arithmetic (2000/quintal → 20/kg)
- Missing-API-key refusal, and the live 503 over real HTTP when no key
  is set — confirmed by actually running the server and hitting it

**To actually use this**: register at https://data.gov.in, get a
personal API key, `export DATA_GOV_API_KEY="your-key"`, then it works
as-is — no code changes needed.

## Vernacular delivery (Bhashini / ULCA)

`app/services/bhashini_service.py` — real client for India's National
Language Translation Mission, using Bhashini's documented two-step
pipeline flow: a **config call** (asks Bhashini which real service can
do a task+language pair, and where to send the next call) followed by
a **compute call** (the actual translation/TTS/ASR inference) — both
steps real, neither hardcoded, matching Bhashini's own documented
architecture rather than a simplified guess at it.

Exposed via `GET
/api/v1/farms/{farm_id}/irrigation-advisory/vernacular?language=hi`
(or `bho` for Bhojpuri, `mai` for Maithili, etc.) — same real advisory
pipeline as before, with `recommendation_text` machine-translated.

**The honesty problem this slice had to solve**: Bhojpuri and Maithili
do appear in Bhashini's published language ecosystem (confirmed via
Bhashini's own site, not assumed) — but *which specific task* (ASR vs.
translation vs. TTS) actually has a working model for a given language
varies, and I could not verify this from the sandbox this was built
in. Rather than hardcode "Bhojpuri TTS works" and risk being wrong in
a way a farmer would only discover mid-conversation, the client asks
Bhashini's config call directly every time, and if no matching service
comes back, it raises a clear error — never silently substitutes
English or a different language without saying so.

**Telegram bot integration**: `/irrigation` now asks which language to
reply in (English, Hindi, Bhojpuri, Maithili) after the farm details.
If translation fails for the chosen language, the farmer gets an
explicit note ("couldn't translate, showing English instead") rather
than a silent substitution — this was a deliberate design choice, not
a limitation to route around later.

**Requires real personal credentials** (`BHASHINI_USER_ID`,
`BHASHINI_API_KEY`) from https://bhashini.gov.in's developer portal —
cannot be obtained on your behalf.

**Verified directly** (same network-boundary pattern as every other
government/external API in this project — `meity-auth.ulcacontrib.org`
isn't reachable from this sandbox either, confirmed by direct attempt):
- Missing-credentials refusal, confirmed with a clean error
- **The full two-step config→compute pipeline**, tested against
  responses shaped exactly like Bhashini's documented schema via a
  substituted HTTP transport (a standard technique for testing client
  logic without live network access — this tests our parsing and
  auth-propagation code, not Bhashini's actual models, and is
  documented here as exactly that, not conflated with a live call).
  This confirmed the translation result parses correctly AND that the
  auth header returned by the config call is correctly propagated to
  the compute call, exactly as Bhashini's docs specify.
- **The critical safety property**: when the config call returns no
  matching service for a language/task pair, `BhashiniServiceError` is
  raised — confirmed directly, not just claimed in a comment
- Bot module rebuilds cleanly with the new language-selection step
  wired into the conversation flow

**Known limitation, not hidden**: the default pipeline ID used
(`64392f96daac500b55c543cd`) is a commonly-cited MeitY default from
multiple independent integration references, not something guaranteed
stable forever — confirm it still resolves via your own Bhashini
dashboard when you set this up for real, and swap it if not.

## What's next (not yet built)

- Bhashini integration for Hindi/Bhojpuri voice or text responses
- Climate-based Kc adjustment (FAO-56 section 6.3)
- Actually training the disease model on real PlantVillage data (the
  code is ready; the training run itself needs to happen on a machine
  with real network access to the dataset and pretrained weights)
- Sourcing a real Bihar cold-storage dataset and running the importer
- Registering a real data.gov.in API key and confirming a live mandi
  price call end-to-end on your machine
- Registering real Bhashini credentials and confirming a live
  translation call end-to-end — including actually checking which of
  Bhojpuri/Maithili/Magahi are supported for translation vs. TTS on
  your account, since this project deliberately didn't assume that
- TTS delivery (voice notes, not just translated text) — the
  `text_to_speech()` function exists in `bhashini_service.py` and is
  tested the same way as translation, but isn't wired into the bot yet

Order so far: irrigation math first (highest technical risk), Telegram
delivery second (the actual product promise), persistence third
(unblocks history and returning-farmer UX), disease detection and cold
storage matching fourth (new technical territory: ML pipeline safety,
and honest handling of a dataset that doesn't exist yet), Alembic
migrations fifth (closing out infrastructure debt before another
schema change piled on top of unmanaged `create_all()`), mandi prices
sixth (same real-API-with-a-network-boundary pattern as weather, plus
a credential only you can obtain), Bhashini vernacular delivery seventh
(closes the loop on Savitri's original vernacular-voice promise — text
translation now works end-to-end in code, voice is one function call
away once wired into the bot).
