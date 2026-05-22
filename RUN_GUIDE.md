# EyeGuard — How to Run Everything

---

## Before You Start (One-Time Setup)

### 1. Install Node.js
Download from https://nodejs.org (LTS version)
After installing, close and reopen your terminal, then verify:
```
node --version
npm --version
```

### 2. Install Python
Download from https://python.org (3.10 or later)
Verify:
```
python --version
```

---

## Running the Frontend (localhost:3000)

Open a terminal and run these commands:

```cmd
cd c:\Users\macky\.gemini\antigravity\scratch\v0-eyestrain
"C:\Program Files\nodejs\npm.cmd" install
"C:\Program Files\nodejs\npm.cmd" run dev
```

Then open your browser and go to:
```
http://localhost:3000
```

> If npm is already on your PATH (works without the full path), just use `npm install` and `npm run dev`.

---

## Running the Backend (localhost:5000)

Open a **second terminal** (keep the first one running) and run:

```cmd
cd c:\Users\macky\.gemini\antigravity\scratch\v0-eyestrain\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The backend will be live at:
```
http://localhost:5000
```

> The first time you run `python app.py`, it will train the ML models automatically.
> This takes about 30 seconds. You will see `[ML] Training complete` in the terminal.

---

## Environment Files (Must Be Set Before Running)

### Frontend — `.env.local` (already configured)
Located at: `c:\Users\macky\.gemini\antigravity\scratch\v0-eyestrain\.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://vpfzjysugqrnshfzsaex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9Pjht7ZoLCPBCi_r2id7bA_15gK4yHy
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend — `backend/.env` (already configured)
Located at: `c:\Users\macky\.gemini\antigravity\scratch\v0-eyestrain\backend\.env`
```
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET=jwt-secret-key-change-in-production
DATABASE_URL=sqlite:///eyeguard.db
CORS_ORIGINS=http://localhost:3000
SUPABASE_URL=https://pcjdxukgmapjkopmfqxt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
RETRAIN_EVERY_N_LOGS=10
```

> ⚠️ IMPORTANT: The SUPABASE_URL in backend/.env must match the same project
> as your frontend. See the note at the bottom of this file.

---

## Useful URLs Once Everything Is Running

| What | URL |
|------|-----|
| App (frontend) | http://localhost:3000 |
| Sign up | http://localhost:3000/signup |
| Login | http://localhost:3000/login |
| Dashboard | http://localhost:3000/dashboard |
| Daily Log | http://localhost:3000/daily-log |
| Analytics | http://localhost:3000/analytics |
| Risk Prediction | http://localhost:3000/risk-prediction |
| Trends | http://localhost:3000/trends |
| Settings | http://localhost:3000/settings |
| Flask API root | http://localhost:5000 |
| ML model status | http://localhost:5000/api/ml/status |
| Manually retrain ML | http://localhost:5000/api/ml/retrain (POST) |

---

## ML Model — How It Works

### Check ML status
Open your browser and go to:
```
http://localhost:5000/api/ml/status
```
You will see something like:
```json
{
  "model_loaded": true,
  "supabase_rows": 45,
  "new_logs_since_retrain": 3,
  "retrain_threshold": 10
}
```

- `model_loaded` — true means the ML model is ready
- `supabase_rows` — how many daily logs are in your Supabase database
- `new_logs_since_retrain` — how many new logs since the last retrain
- `retrain_threshold` — retrain happens automatically after this many new logs

### Manually trigger a retrain
Open a terminal and run:
```cmd
curl -X POST http://localhost:5000/api/ml/retrain
```
Or just open this URL in a REST client (Postman, etc.) as a POST request.

### Auto-retrain
Every time a user submits a daily log, the counter goes up by 1.
When it hits 10 (the threshold), the model retrains automatically in the background
using all the data in your Supabase `daily_logs` table.
You will see `[ML] Background retrain started...` in the Flask terminal.

---

## Stopping the Servers

In each terminal, press:
```
Ctrl + C
```

---

## Restarting After a Reboot

You do NOT need to run `npm install` or `pip install` again.
Just run:

**Terminal 1 (frontend):**
```cmd
cd c:\Users\macky\.gemini\antigravity\scratch\v0-eyestrain
"C:\Program Files\nodejs\npm.cmd" run dev
```

**Terminal 2 (backend):**
```cmd
cd c:\Users\macky\.gemini\antigravity\scratch\v0-eyestrain\backend
venv\Scripts\activate
python app.py
```

---

## Troubleshooting

### npm not recognized
Run the full path:
```cmd
"C:\Program Files\nodejs\npm.cmd" run dev
```
Or add Node.js to PATH: Win + S → "Environment Variables" → add `C:\Program Files\nodejs`

### Flask backend not starting
Make sure the venv is activated (you should see `(venv)` in your terminal prompt):
```cmd
venv\Scripts\activate
```
Then try again:
```cmd
python app.py
```

### ML models not training / Supabase connection error
Check that `backend/.env` has the correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
The service role key must come from the **same Supabase project** as your frontend.

To get the correct service role key:
1. Go to https://supabase.com
2. Open your project (the one at vpfzjysugqrnshfzsaex.supabase.co)
3. Project Settings → API → copy the `service_role` key
4. Paste it into `backend/.env` as `SUPABASE_SERVICE_ROLE_KEY`

### Login says "Invalid credentials"
You need to sign up first at http://localhost:3000/signup
The Supabase database is empty until you create an account.

### Daily log not saving
Make sure both the frontend (port 3000) AND backend (port 5000) are running at the same time.

---

## Summary — Full Startup Checklist

- [ ] Terminal 1: `npm run dev` → frontend running at localhost:3000
- [ ] Terminal 2: `venv\Scripts\activate` then `python app.py` → backend at localhost:5000
- [ ] Open http://localhost:3000 in browser
- [ ] Sign up for an account
- [ ] Submit a daily log
- [ ] Check http://localhost:5000/api/ml/status to confirm ML is working
