"""
import_cold_storage_csv.py

Imports real cold storage facility records from a CSV into the
cold_storages table. This script does not generate, guess, or
interpolate any facility data — it only loads what's actually in the
CSV you give it.

Expected CSV columns (header row required):
    name,lat,lon,capacity_tons,district,state,source

A pre-curated starter dataset (50 real facilities across 15 states) is
provided at backend/data/cold_storage_india.csv — import it first:

    python3 scripts/import_cold_storage_csv.py --csv data/cold_storage_india.csv

    - name: facility name (required)
    - lat, lon: decimal degrees (required)
    - capacity_tons: storage capacity in metric tons (optional, blank OK)
    - district: administrative district (optional, blank OK)
    - source: where this record came from, e.g. "data.gov.in 2024-25
      warehousing dataset" (optional but strongly recommended — keeps
      the provenance of every row honest and traceable)

Where to actually get real data (none of these were reachable from the
sandbox this project was built in — data.gov.in isn't on that
environment's network allowlist — so sourcing this is a step for you
to do on your own machine):

    - https://www.data.gov.in — search "cold storage" or "warehousing
      capacity"; look for state-wise or facility-level datasets under
      the Ministry of Agriculture & Farmers Welfare or Ministry of
      Food Processing Industries
    - https://www.manage.gov.in — MANAGE (National Institute of
      Agricultural Extension Management) has published state-wise cold
      storage spreadsheets
    - Your state's Department of Agriculture or Horticulture may
      publish a more current/accurate list for Bihar specifically than
      national aggregates

Usage:
    python3 scripts/import_cold_storage_csv.py --csv /path/to/real_data.csv
"""

import argparse
import asyncio
import csv
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db import init_db, AsyncSessionLocal
from app.models_db import ColdStorage


async def import_csv(csv_path: str, dry_run: bool = False) -> int:
    rows_imported = 0

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        required = {"name", "lat", "lon"}
        if not required.issubset(set(reader.fieldnames or [])):
            raise ValueError(
                f"CSV must have at least columns {required}. Found: {reader.fieldnames}"
            )

        records = []
        for i, row in enumerate(reader, start=2):  # start=2: header is line 1
            name = row.get("name", "").strip()
            if not name:
                print(f"  Skipping line {i}: missing name")
                continue
            try:
                lat = float(row["lat"])
                lon = float(row["lon"])
            except (ValueError, KeyError):
                print(f"  Skipping line {i} ('{name}'): invalid or missing lat/lon")
                continue

            capacity = row.get("capacity_tons", "").strip()
            capacity_val = float(capacity) if capacity else None

            records.append(ColdStorage(
                name=name, lat=lat, lon=lon,
                capacity_tons=capacity_val,
                district=row.get("district", "").strip() or None,
                state=row.get("state", "").strip() or None,
                source=row.get("source", "").strip() or None,
            ))

        if dry_run:
            print(f"[DRY RUN] Would import {len(records)} facilities:")
            for r in records[:10]:
                print(f"  - {r.name} ({r.lat}, {r.lon})")
            if len(records) > 10:
                print(f"  ... and {len(records) - 10} more")
            return len(records)

        await init_db()
        async with AsyncSessionLocal() as session:
            session.add_all(records)
            await session.commit()
        rows_imported = len(records)

    return rows_imported


def main():
    parser = argparse.ArgumentParser(description="Import real cold storage facility data from CSV")
    parser.add_argument("--csv", required=True, help="Path to CSV file with real facility data")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing to DB")
    args = parser.parse_args()

    count = asyncio.run(import_csv(args.csv, dry_run=args.dry_run))
    action = "Would import" if args.dry_run else "Imported"
    print(f"\n{action} {count} real cold storage facility records.")


if __name__ == "__main__":
    main()
