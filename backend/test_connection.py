"""Quick test — run: python test_connection.py"""
import requests

URL = "https://vpfzjysugqrnshfzsaex.supabase.co/rest/v1/daily_logs?limit=1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZnpqeXN1Z3FybnNoZnpzYWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDQ2NCwiZXhwIjoyMDkzNTY2NDY0fQ.qdi36Xq_5_itsNWw3uMEQwMNbaeElaR9qvO-bsif3qA"

headers = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
r = requests.get(URL, headers=headers, timeout=10)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:300]}")

# Also test insert with one row
print("\nTesting insert...")
INSERT_URL = "https://vpfzjysugqrnshfzsaex.supabase.co/rest/v1/daily_logs"
headers["Content-Type"] = "application/json"
headers["Prefer"] = "return=minimal"

test_row = {
    "date": "2026-03-18",
    "email": "test@test.com",
    "age": 21,
    "gender": "Male",
    "year_level": "3rd Year",
    "field_of_study": "IT / Computer Science",
    "screen_time": 3.0,
    "breaks_taken": 4,
    "eye_strain": 1,
    "headaches": 0,
    "blurry_vision": 0,
    "dry_eyes": 1,
    "brightness": 70,
    "sleep_hours": 7.5,
    "risk_level": "Moderate",
    "notes": "Test row"
}

r2 = requests.post(INSERT_URL, headers=headers, json=test_row, timeout=10)
print(f"Insert status: {r2.status_code}")
print(f"Insert response: {r2.text[:300]}")
