"""
agrivoltaics_service.py

Real, cited state-tariff arithmetic for the "Second Income" advisor.
Only states with a real, sourced published rate are supported — an
unlisted state raises a clear error rather than guessing a rate,
matching this project's zero-mock-logic policy.

Rates as cited in the project's own research (brainstorming.MD):
  - Odisha: ~Rs 20,000/acre/year for hosting solar panels
  - Delhi:  ~Rs 8,333/acre/month for hosting solar panels

These are the SOLAR HOSTING rate only — they do not include any
projected value from the shade-tolerant crop grown underneath, which
would require crop-specific yield data this project doesn't have yet
(flagged, not estimated).
"""

from __future__ import annotations

from dataclasses import dataclass

STATE_RATES_PER_ACRE_PER_YEAR: dict[str, dict] = {
    "odisha": {
        "annual_rate": 20000.0,
        "source": "Odisha state agrivoltaics land-hosting scheme (~Rs 20,000/acre/year), as cited in project research",
    },
    "delhi": {
        "annual_rate": 8333.0 * 12,
        "source": "Delhi agrivoltaics land-hosting scheme (~Rs 8,333/acre/month), as cited in project research",
    },
}


@dataclass
class AgrivoltaicsEstimate:
    state: str
    land_acres: float
    annual_income_estimate: float
    rate_basis: str
    source: str


def calculate_agrivoltaics_income(state: str, land_acres: float) -> AgrivoltaicsEstimate:
    if land_acres <= 0:
        raise ValueError("land_acres must be positive.")

    key = state.strip().lower()
    if key not in STATE_RATES_PER_ACRE_PER_YEAR:
        raise ValueError(
            f"No cited agrivoltaics land-hosting rate for '{state}'. "
            f"Available: {', '.join(s.title() for s in STATE_RATES_PER_ACRE_PER_YEAR.keys())}. "
            f"Add a real sourced rate before supporting this state — never guess one."
        )

    rate = STATE_RATES_PER_ACRE_PER_YEAR[key]
    annual = rate["annual_rate"] * land_acres

    return AgrivoltaicsEstimate(
        state=state.title(),
        land_acres=land_acres,
        annual_income_estimate=round(annual, 2),
        rate_basis=f"Rs {rate['annual_rate']:,.0f}/acre/year x {land_acres} acre(s) — solar hosting rate only, crop income not included",
        source=rate["source"],
    )