"""
Supabase Data Loader

Fetches real daily_logs from Supabase and converts them into
the format expected by the ML training pipeline.
"""

import os
from typing import List, Dict, Tuple, Optional
from datetime import datetime


def get_supabase_client():
    """
    Create a Supabase client using the service role key so the
    backend can read all users' data for training (bypasses RLS).
    """
    try:
        from supabase import create_client, Client

        url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        # Use service role key for backend — never expose this to the frontend
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

        if not url or not key:
            print("[ML] Supabase credentials not set (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)")
            return None

        return create_client(url, key)
    except ImportError:
        print("[ML] supabase-py not installed. Run: pip install supabase")
        return None
    except Exception as e:
        print(f"[ML] Could not create Supabase client: {e}")
        return None


def fetch_training_data() -> Tuple[List[Dict], List[int], List[float]]:
    """
    Pull all daily_logs rows from Supabase and convert them into
    (daily_logs, risk_levels, risk_percentages) for model training.

    Returns:
        Tuple of (daily_logs, risk_levels, risk_percentages)
        Returns empty lists if Supabase is unavailable or has no data.
    """
    client = get_supabase_client()
    if client is None:
        return [], [], []

    try:
        # Fetch all rows — service role key bypasses RLS
        response = (
            client.table("daily_logs")
            .select(
                "screen_time, breaks_taken, eye_strain, headaches, "
                "blurry_vision, dry_eyes, brightness, sleep_hours, "
                "risk_level, eye_strain_frequency, headaches_frequency, "
                "blurry_vision_frequency, dry_eyes_frequency"
            )
            .execute()
        )

        rows = response.data or []
        if not rows:
            print("[ML] No rows found in daily_logs table")
            return [], [], []

        print(f"[ML] Fetched {len(rows)} rows from Supabase for training")

        daily_logs = []
        risk_levels = []
        risk_percentages = []

        risk_label_map = {
            "low": 0,
            "moderate": 1,
            "high": 2,
            "critical": 3,
            "severe": 3,
        }

        for row in rows:
            # Build symptom list from boolean columns
            symptoms = []
            if row.get("eye_strain"):
                symptoms.append("moderate_eye_strain")
            if row.get("headaches"):
                symptoms.append("headache")
            if row.get("blurry_vision"):
                symptoms.append("blurred_vision")
            if row.get("dry_eyes"):
                symptoms.append("dry_eyes")

            # Map frequency strings to break_type proxy
            # (we don't store break_type in Supabase, so use a neutral default)
            log = {
                "screen_time_hours": float(row.get("screen_time") or 0),
                "break_minutes": float(row.get("breaks_taken") or 0) * 5,  # estimate 5 min/break
                "symptoms": symptoms,
                "sleep_quality": float(row.get("sleep_hours") or 7),
                "water_intake_cups": 6,          # not tracked — use neutral default
                "break_type": "rest",            # not tracked — use neutral default
                "eye_exercises": 0,              # not tracked — use neutral default
                "blue_light_filter": False,      # not tracked — use neutral default
                "brightness": float(row.get("brightness") or 70),
            }

            # Determine numeric risk level
            raw_risk = (row.get("risk_level") or "moderate").lower()
            risk_level_int = risk_label_map.get(raw_risk, 1)

            # Estimate risk percentage from risk level + screen time
            screen_time = log["screen_time_hours"]
            base_pct = risk_level_int * 25.0          # 0, 25, 50, 75
            screen_bonus = min(screen_time / 12 * 20, 20)  # up to +20
            symptom_bonus = len(symptoms) * 3.0
            risk_pct = min(100.0, base_pct + screen_bonus + symptom_bonus)

            daily_logs.append(log)
            risk_levels.append(risk_level_int)
            risk_percentages.append(risk_pct)

        return daily_logs, risk_levels, risk_percentages

    except Exception as e:
        print(f"[ML] Error fetching training data from Supabase: {e}")
        return [], [], []


def count_training_rows() -> int:
    """Return the number of rows available in daily_logs for training."""
    client = get_supabase_client()
    if client is None:
        return 0
    try:
        response = (
            client.table("daily_logs")
            .select("id", count="exact")
            .execute()
        )
        return response.count or 0
    except Exception as e:
        print(f"[ML] Error counting training rows: {e}")
        return 0
