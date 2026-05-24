Click "Retrain Model" in admin
       ↓
Flask fetches ALL daily_logs from Supabase
       ↓
Retrains scikit-learn models on that data
       ↓
Saves new models to backend/ml/models/
       ↓
New predictions use the updated model


RUN THE BACKEND
cd c:\Users\darkt\Videos\v0-eyestrain-main\backend
venv\Scripts\activate
python app.py

It also auto-retrains every 10 new log submissions automatically.
The only requirement is that Flask is running when you click Retrain.


Your system has two parts to deploy:

1. Next.js frontend → deploy to Vercel (free, easy)

Just push to GitHub and connect to Vercel
All your API routes (/api/chat, /api/admin/*, etc.) run as serverless functions
Supabase connection works the same way
2. Flask backend (ML) → deploy to Railway or Render (both have free tiers)

This is where the ML model lives and retrains
You set NEXT_PUBLIC_API_URL in Vercel to point to your Railway/Render URL instead of localhost:5000
Once deployed, retraining still works:

The admin "Retrain Model" button calls your deployed Flask URL
Flask fetches from Supabase, retrains, saves models to disk on the server
Auto-retrain every 10 logs also still works
One issue to be aware of: Railway/Render free tier servers have ephemeral storage — meaning saved model files (.pkl) get wiped when the server restarts. To fix this you'd need to either:

Save models to Supabase Storage or AWS S3 instead of local disk
Or use a paid tier with persistent disk