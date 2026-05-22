"""
Survey importer using direct REST API calls (no supabase-py needed).
Run with:  python run_import.py

FIRST run this in Supabase SQL Editor:
  ALTER TABLE public.daily_logs ALTER COLUMN user_id DROP NOT NULL;
  ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS daily_logs_user_id_fkey;
"""
import subprocess, sys, json
try:
    import requests
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

from datetime import datetime

SUPABASE_URL = "https://vpfzjysugqrnshfzsaex.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZnpqeXN1Z3FybnNoZnpzYWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDQ2NCwiZXhwIjoyMDkzNTY2NDY0fQ.qdi36Xq_5_itsNWw3uMEQwMNbaeElaR9qvO-bsif3qA"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}
INSERT_URL = f"{SUPABASE_URL}/rest/v1/daily_logs"

def st(v): return {"Less than 2 hours":1.0,"2–4 hours":3.0,"4–6 hours":5.0,"6–8 hours":7.0,"More than 8 hours":9.0}.get(v,3.0)
def sl(v): return {"Less than 5 hours":4.0,"5–6 hours":5.5,"7–8 hours":7.5,"More than 8 hours":9.0}.get(v,6.0)
def br(v): return {"Rarely take breaks":0,"Every 20 minutes":6,"Every 30–60 minutes":4,"Every 1–2 hours":2}.get(v,2)
def sy(v): return 0 if v in ("Never","Rarely","") else 1
def rk(v): return {"None":"Low","Mild":"Low","Moderate":"Moderate","Severe":"High","High":"High","Low":"Low","Medium":"Moderate"}.get(v,"Moderate")
def bg(v): return {"Less than 20 cm":85,"20–40 cm":70,"40–60 cm":60,"More than 60 cm":50}.get(v,70)
def dt(s):
    try: return str(datetime.strptime(s.strip(),"%m/%d/%Y").date())
    except: return str(datetime.today().date())

def build(r):
    d,em,age,gen,yr,fld,ast,nast,dev,hwt,bps,bpat,slr,q14,q15,dis,q17,dist,bl,bfr,df,ef,bvf,hf,irf,lsf,dff,npf,mtf,dcf,sev,sfr = r
    # Map numeric age to range string to match existing data format
    age_int = int(age)
    if age_int <= 16: age_str = "15-16"
    elif age_int <= 18: age_str = "17-18"
    elif age_int <= 20: age_str = "19-20"
    elif age_int <= 22: age_str = "21-22"
    else: age_str = "23+"
    return {
        "date": dt(d), "email": em or None, "age": age_str, "gender": gen,
        "year_level": yr, "field_of_study": fld,
        "academic_screen_time": ast, "non_academic_screen_time": nast,
        "screen_time": st(ast), "primary_device": dev, "breaks_taken": br(bpat),
        "eye_strain": int(bool(sy(df) or sy(ef) or sy(dff))),
        "eye_strain_frequency": df,
        "headaches": sy(hf), "headaches_frequency": hf,
        "blurry_vision": sy(bvf), "blurry_vision_frequency": bvf,
        "dry_eyes": sy(df), "dry_eyes_frequency": df,
        "brightness": bg(dist), "sleep_hours": sl(slr),
        "notes": f"Survey import. Severity:{sev}. Freq:{sfr}.",
        "risk_level": rk(sev),
    }

ROWS = [
("3/18/2026","",21,"Male","3rd Year","IT / Computer Science","2–4 hours","More than 7 hours","Smartphone","1–2 hours","None","Every 30–60 minutes","7–8 hours","Sometimes","Sometimes","Medium","Sometimes","20–40 cm","No","Every 30–60 minutes","Sometimes","Sometimes","Rarely","Rarely","Sometimes","Rarely","Never","Rarely","Sometimes","Sometimes","Mild","Sometimes"),
("3/20/2026","mraendic@tip.edu.ph",21,"Male","3rd Year","IT / Computer Science","2–4 hours","3–5 hours","Smartphone","1–2 hours","None","Every 20 minutes","5–6 hours","Rarely","Always","Low","Rarely","20–40 cm","Yes","Every 20 minutes","Never","Never","Never","Never","Never","Never","Never","Never","Sometimes","Sometimes","Mild","Sometimes"),
("3/21/2026","jtsmflo16@gmail.com",19,"Male","4th Year","IT / Computer Science","2–4 hours","3–5 hours","Desktop Computer","More than 3 hours","None","Every 1–2 hours","7–8 hours","Never","Never","Medium","Always","20–40 cm","No","Every 1–2 hours","Never","Rarely","Rarely","Sometimes","Rarely","Rarely","Never","Always","Sometimes","Rarely","Moderate","Often"),
("3/21/2026","amacqueldave@gmail.com",19,"Male","1st Year","Other","6–8 hours","5–7 hours","Smartphone","1–2 hours","3–4","Every 30–60 minutes","5–6 hours","Always","Always","Low","Sometimes","20–40 cm","Yes","Every 30–60 minutes","Sometimes","Sometimes","Often","Often","Sometimes","Often","Often","Often","Sometimes","Sometimes","Mild","Sometimes"),
("3/21/2026","yohomie2345@gmail.com",19,"Male","1st Year","IT / Computer Science","6–8 hours","Less than 1 hour","Laptop","1–2 hours","3–4","Every 20 minutes","5–6 hours","Never","Sometimes","Medium","Always","20–40 cm","No","Every 20 minutes","Never","Never","Sometimes","Never","Never","Sometimes","Rarely","Rarely","Rarely","Rarely","Mild","Often"),
("3/21/2026","mallari.jastinejeos@gmail.com",17,"Prefer not to say","1st Year","Arts and Humanities","2–4 hours","5–7 hours","Smartphone","More than 3 hours","1–2","Every 20 minutes","Less than 5 hours","Never","Rarely","Low","Always","20–40 cm","Yes","Every 20 minutes","Rarely","Never","Often","Sometimes","Never","Never","Never","Always","Sometimes","Sometimes","Mild","Sometimes"),
("3/21/2026","gilxanderjohn@gmail.com",17,"Male","1st Year","Other","6–8 hours","5–7 hours","Smartphone","1–2 hours","1–2","Every 30–60 minutes","More than 8 hours","Rarely","Never","Medium","Sometimes","20–40 cm","No","Every 30–60 minutes","Sometimes","Sometimes","Sometimes","Always","Sometimes","Never","Sometimes","Always","Always","Often","Mild","Rarely"),
("3/21/2026","dalisaykurt17@gmail.com",19,"Male","2nd Year","Health Sciences","2–4 hours","3–5 hours","Tablet","1–2 hours","None","Rarely take breaks","5–6 hours","Never","Rarely","Low","Always","20–40 cm","Yes","Rarely take breaks","Rarely","Never","Never","Sometimes","Never","Sometimes","Never","Never","Rarely","Sometimes","Mild","Never"),
("3/21/2026","kecygermise@gmail.com",19,"Female","1st Year","Health Sciences","4–6 hours","3–5 hours","Smartphone","2–3 hours","1–2","Every 1–2 hours","5–6 hours","Never","Never","Low","Sometimes","20–40 cm","No","Every 1–2 hours","Never","Rarely","Rarely","Never","Rarely","Never","Never","Sometimes","Sometimes","Sometimes","Mild","Often"),
("3/21/2026","philiprosario306@yahoo.com",19,"Male","1st Year","Health Sciences","2–4 hours","1–3 hours","Smartphone","30–60 minutes","1–2","Every 30–60 minutes","7–8 hours","Rarely","Sometimes","Medium","Always","20–40 cm","No","Every 30–60 minutes","Rarely","Rarely","Often","Never","Rarely","Rarely","Often","Often","Sometimes","Sometimes","Mild","Sometimes"),
("3/21/2026","joshjaervhynne027@gmail.com",19,"Male","1st Year","Engineering","6–8 hours","3–5 hours","Smartphone","30–60 minutes","3–4","Every 30–60 minutes","7–8 hours","Sometimes","Rarely","Low","Always","20–40 cm","No","Every 30–60 minutes","Sometimes","Rarely","Never","Rarely","Rarely","Sometimes","Rarely","Never","Rarely","Rarely","Mild","Rarely"),
("3/21/2026","rhiancamasis@gmail.com",17,"Female","1st Year","Other","More than 8 hours","3–5 hours","Smartphone","2–3 hours","1–2","Every 30–60 minutes","5–6 hours","Sometimes","Sometimes","Low","Always","20–40 cm","Yes","Every 30–60 minutes","Always","Sometimes","Always","Always","Sometimes","Often","Sometimes","Often","Often","Often","Moderate","Sometimes"),
("3/21/2026","julius.salazar04@gmail.com",19,"Male","1st Year","Other","More than 8 hours","More than 7 hours","Smartphone","More than 3 hours","3–4","Rarely take breaks","Less than 5 hours","Never","Never","Low","Always","Less than 20 cm","Yes","Rarely take breaks","Never","Never","Never","Never","Never","Sometimes","Never","Sometimes","Sometimes","Sometimes","None","Sometimes"),
("3/21/2026","jtsulayao2303qc@student.fatima.edu.ph",21,"Male","3rd Year","IT / Computer Science","6–8 hours","3–5 hours","Desktop Computer","1–2 hours","3–4","Every 1–2 hours","7–8 hours","Never","Never","Low","Sometimes","Less than 20 cm","Yes","Every 1–2 hours","Often","Sometimes","Often","Never","Sometimes","Often","Rarely","Sometimes","Sometimes","Sometimes","Mild","Sometimes"),
("3/21/2026","eymielenzog@gmail.com",21,"Female","3rd Year","Other","4–6 hours","5–7 hours","Smartphone","1–2 hours","1–2","Every 1–2 hours","5–6 hours","Rarely","Rarely","Medium","Sometimes","40–60 cm","Yes","Every 1–2 hours","Never","Rarely","Always","Rarely","Never","Often","Sometimes","Often","Rarely","Sometimes","Mild","Sometimes"),
("3/21/2026","eirene.bianca27@gmail.com",19,"Female","1st Year","Other","6–8 hours","5–7 hours","Tablet","More than 3 hours","None","Every 20 minutes","Less than 5 hours","Rarely","Never","Medium","Rarely","20–40 cm","Yes","Every 20 minutes","Never","Never","Sometimes","Rarely","Rarely","Often","Sometimes","Sometimes","Sometimes","Sometimes","Moderate","Sometimes"),
("3/21/2026","angelicafaithpusot@gmail.com",19,"Female","3rd Year","Other","2–4 hours","5–7 hours","Smartphone","More than 3 hours","None","Rarely take breaks","5–6 hours","Never","Never","Medium","Rarely","40–60 cm","No","Rarely take breaks","Sometimes","Rarely","Rarely","Rarely","Rarely","Rarely","Rarely","Sometimes","Sometimes","Sometimes","Moderate","Sometimes"),
("3/22/2026","mcalcover1790qc@student.fatima.edu.ph",19,"Male","3rd Year","IT / Computer Science","2–4 hours","5–7 hours","Smartphone","1–2 hours","1–2","Every 30–60 minutes","5–6 hours","Rarely","Always","Low","Always","20–40 cm","No","Every 30–60 minutes","Sometimes","Sometimes","Rarely","Rarely","Sometimes","Sometimes","Sometimes","Often","Often","Always","Mild","Often"),
("3/22/2026","aadrueco2117qc@student.fatima.edu.ph",21,"Male","3rd Year","IT / Computer Science","Less than 2 hours","More than 7 hours","Smartphone","More than 3 hours","None","Rarely take breaks","5–6 hours","Never","Never","Low","Always","20–40 cm","No","Rarely take breaks","Rarely","Sometimes","Sometimes","Rarely","Sometimes","Never","Rarely","Rarely","Often","Often","Moderate","Sometimes"),
("3/26/2026","johnmark56334@gmail.com",21,"Male","3rd Year","IT / Computer Science","2–4 hours","3–5 hours","Desktop Computer","More than 3 hours","1–2","Every 30–60 minutes","More than 8 hours","Never","Never","Low","Sometimes","More than 60 cm","Yes","Every 30–60 minutes","Never","Never","Rarely","Never","Never","Never","Never","Never","Rarely","Never","None","Sometimes"),
("3/27/2026","qglpcampos@tip.edu.ph",21,"Male","3rd Year","IT / Computer Science","Less than 2 hours","3–5 hours","Smartphone","30–60 minutes","1–2","Every 1–2 hours","5–6 hours","Rarely","Sometimes","Medium","Sometimes","Less than 20 cm","Yes","Every 1–2 hours","Rarely","Rarely","Sometimes","Sometimes","Rarely","Rarely","Often","Rarely","Rarely","Sometimes","Mild","Rarely"),
("3/27/2026","acedanielpanesa18@gmail.com",21,"Male","3rd Year","IT / Computer Science","6–8 hours","More than 7 hours","Laptop","2–3 hours","3–4","Every 30–60 minutes","Less than 5 hours","Never","Never","Medium","Always","20–40 cm","Yes","Every 30–60 minutes","Sometimes","Often","Always","Sometimes","Often","Never","Never","Often","Rarely","Sometimes","Moderate","Often"),
("3/27/2026","francheskarmataya12@gmail.com",19,"Female","1st Year","Other","4–6 hours","3–5 hours","Tablet","More than 3 hours","1–2","Every 20 minutes","More than 8 hours","Rarely","Rarely","Medium","Always","20–40 cm","Yes","Every 20 minutes","Rarely","Sometimes","Never","Sometimes","Rarely","Rarely","Sometimes","Sometimes","Sometimes","Sometimes","Moderate","Sometimes"),
("3/27/2026","joannamaytalino77@gmail.com",19,"Female","1st Year","Other","4–6 hours","5–7 hours","Smartphone","30–60 minutes","1–2","Every 1–2 hours","5–6 hours","Sometimes","Sometimes","Low","Sometimes","Less than 20 cm","Yes","Every 1–2 hours","Rarely","Rarely","Sometimes","Rarely","Sometimes","Sometimes","Sometimes","Rarely","Never","Sometimes","Mild","Sometimes"),
("3/27/2026","gradoagelkate@gmail.com",19,"Female","1st Year","Other","2–4 hours","1–3 hours","Smartphone","More than 3 hours","1–2","Rarely take breaks","Less than 5 hours","Never","Always","Low","Always","20–40 cm","Yes","Rarely take breaks","Never","Never","Sometimes","Sometimes","Never","Sometimes","Sometimes","Sometimes","Sometimes","Never","Mild","Sometimes"),
]

ROWS += [
("3/27/2026","princessatinguin177@gmail.com",17,"Female","1st Year","Other","Less than 2 hours","1–3 hours","Laptop","30–60 minutes","3–4","Every 30–60 minutes","More than 8 hours","Never","Never","Low","Never","20–40 cm","No","Every 30–60 minutes","Sometimes","Sometimes","Always","Sometimes","Sometimes","Always","Rarely","Always","Always","Sometimes","Mild","Sometimes"),
("3/27/2026","riveraarvie45@gmail.com",17,"Female","1st Year","Health Sciences","6–8 hours","5–7 hours","Smartphone","2–3 hours","None","Every 30–60 minutes","Less than 5 hours","Rarely","Always","Medium","Sometimes","20–40 cm","Yes","Every 30–60 minutes","Sometimes","Sometimes","Often","Often","Sometimes","Rarely","Rarely","Sometimes","Often","Sometimes","Mild","Sometimes"),
("3/27/2026","salvatierraeurica@gmail.com",17,"Female","1st Year","Other","Less than 2 hours","More than 7 hours","Smartphone","More than 3 hours","1–2","Rarely take breaks","5–6 hours","Never","Always","Medium","Sometimes","20–40 cm","No","Rarely take breaks","Never","Rarely","Often","Often","Often","Sometimes","Never","Sometimes","Always","Always","Moderate","Often"),
("3/27/2026","saysonchristelnovie@gmail.com",17,"Female","1st Year","Other","4–6 hours","5–7 hours","Smartphone","1–2 hours","None","Every 1–2 hours","5–6 hours","Sometimes","Sometimes","Low","Sometimes","20–40 cm","No","Every 1–2 hours","Often","Often","Rarely","Sometimes","Sometimes","Often","Rarely","Always","Always","Sometimes","Mild","Sometimes"),
("3/27/2026","prinzjoseffloreza0916@gmail.com",17,"Male","1st Year","Other","2–4 hours","3–5 hours","Smartphone","30–60 minutes","1–2","Every 30–60 minutes","7–8 hours","Rarely","Sometimes","Medium","Sometimes","20–40 cm","No","Every 30–60 minutes","Never","Never","Never","Never","Never","Never","Rarely","Never","Never","Rarely","None","Rarely"),
("3/27/2026","ljreyes0103@gmail.com",19,"Prefer not to say","1st Year","Other","4–6 hours","More than 7 hours","Smartphone","1–2 hours","3–4","Every 20 minutes","5–6 hours","Sometimes","Never","Medium","Sometimes","20–40 cm","Yes","Every 20 minutes","Sometimes","Often","Rarely","Rarely","Rarely","Sometimes","Rarely","Sometimes","Sometimes","Rarely","Mild","Sometimes"),
("3/27/2026","galangclarkjohn@gmail.com",19,"Male","1st Year","Other","Less than 2 hours","5–7 hours","Smartphone","2–3 hours","1–2","Every 30–60 minutes","Less than 5 hours","Never","Sometimes","Medium","Sometimes","20–40 cm","No","Every 30–60 minutes","Sometimes","Sometimes","Rarely","Rarely","Often","Rarely","Sometimes","Rarely","Often","Always","Moderate","Sometimes"),
("3/27/2026","domingoleika@gmail.com",17,"Female","1st Year","Arts and Humanities","6–8 hours","More than 7 hours","Smartphone","More than 3 hours","1–2","Rarely take breaks","7–8 hours","Never","Never","Low","Sometimes","20–40 cm","No","Rarely take breaks","Rarely","Sometimes","Never","Rarely","Rarely","Rarely","Rarely","Sometimes","Rarely","Rarely","None","Rarely"),
("3/27/2026","juanillocherylramirez@gmail.com",17,"Female","1st Year","Other","4–6 hours","1–3 hours","Smartphone","30–60 minutes","1–2","Every 30–60 minutes","5–6 hours","Rarely","Sometimes","Low","Always","20–40 cm","Yes","Every 30–60 minutes","Never","Rarely","Sometimes","Sometimes","Rarely","Rarely","Rarely","Sometimes","Sometimes","Sometimes","Mild","Rarely"),
("3/27/2026","asiayacordova@gmail.com",17,"Female","1st Year","Education","More than 8 hours","More than 7 hours","Smartphone","More than 3 hours","None","Rarely take breaks","Less than 5 hours","Never","Never","Low","Always","20–40 cm","No","Rarely take breaks","Never","Sometimes","Often","Sometimes","Never","Never","Never","Often","Never","Sometimes","Mild","Never"),
("3/27/2026","shereyragasa09@gmail.com",17,"Female","1st Year","Education","4–6 hours","3–5 hours","Smartphone","30–60 minutes","3–4","Every 1–2 hours","5–6 hours","Always","Always","Low","Sometimes","40–60 cm","No","Every 1–2 hours","Rarely","Sometimes","Often","Sometimes","Sometimes","Sometimes","Sometimes","Rarely","Sometimes","Sometimes","Mild","Sometimes"),
("3/27/2026","cherfruitea@gmail.com",17,"Female","1st Year","Health Sciences","4–6 hours","5–7 hours","Smartphone","2–3 hours","None","Every 30–60 minutes","Less than 5 hours","Rarely","Always","Medium","Always","20–40 cm","No","Every 30–60 minutes","Rarely","Never","Rarely","Never","Never","Never","Never","Rarely","Rarely","Rarely","Mild","Rarely"),
("3/27/2026","angel.alacon27@gmail.com",19,"Female","2nd Year","Business","2–4 hours","5–7 hours","Smartphone","1–2 hours","5 or more","Every 20 minutes","7–8 hours","Rarely","Sometimes","Low","Always","20–40 cm","No","Every 20 minutes","Often","Sometimes","Often","Always","Rarely","Often","Rarely","Often","Always","Always","Moderate","Sometimes"),
("3/27/2026","ashnicmallows01@gmail.com",19,"Female","1st Year","Health Sciences","4–6 hours","1–3 hours","Tablet","1–2 hours","1–2","Every 30–60 minutes","5–6 hours","Sometimes","Sometimes","Low","Sometimes","20–40 cm","No","Every 30–60 minutes","Rarely","Sometimes","Often","Rarely","Never","Rarely","Never","Rarely","Always","Often","Moderate","Often"),
("3/27/2026","balucanjhonllyod@gmail.com",21,"Male","1st Year","Business","2–4 hours","3–5 hours","Smartphone","Less than 30 minutes","None","Rarely take breaks","5–6 hours","Never","Never","High","Always","20–40 cm","No","Rarely take breaks","Sometimes","Rarely","Never","Sometimes","Never","Never","Sometimes","Never","Rarely","Rarely","Mild","Sometimes"),
("3/27/2026","fajardocedric71@gmail.com",23,"Male","1st Year","IT / Computer Science","2–4 hours","3–5 hours","Smartphone","30–60 minutes","None","Rarely take breaks","5–6 hours","Never","Sometimes","High","Always","20–40 cm","No","Rarely take breaks","Sometimes","Sometimes","Often","Always","Sometimes","Never","Rarely","Never","Sometimes","Sometimes","Mild","Sometimes"),
("3/27/2026","errolgalvez5@gmail.com",17,"Male","1st Year","Business","4–6 hours","3–5 hours","Smartphone","More than 3 hours","1–2","Rarely take breaks","5–6 hours","Never","Rarely","High","Always","40–60 cm","No","Rarely take breaks","Often","Sometimes","Rarely","Rarely","Rarely","Never","Never","Sometimes","Sometimes","Sometimes","Mild","Sometimes"),
("3/27/2026","ahngylian19@gmail.con",17,"Female","1st Year","Health Sciences","4–6 hours","More than 7 hours","Smartphone","1–2 hours","None","Every 30–60 minutes","7–8 hours","Rarely","Always","Low","Always","20–40 cm","Yes","Every 30–60 minutes","Rarely","Rarely","Sometimes","Often","Rarely","Rarely","Rarely","Sometimes","Sometimes","Sometimes","Mild","Sometimes"),
("3/27/2026","markdelossantos0711@gmail.com",17,"Male","1st Year","Other","Less than 2 hours","Less than 1 hour","Smartphone","Less than 30 minutes","1–2","Every 20 minutes","7–8 hours","Always","Always","Medium","Sometimes","Less than 20 cm","No","Every 20 minutes","Sometimes","Never","Never","Rarely","Never","Never","Rarely","Sometimes","Sometimes","Sometimes","None","Often"),
("3/27/2026","asdelatorre5189qc@student.fatima.edu.ph",17,"Female","1st Year","Other","6–8 hours","3–5 hours","Smartphone","More than 3 hours","1–2","Every 30–60 minutes","5–6 hours","Sometimes","Never","Medium","Always","Less than 20 cm","Yes","Every 30–60 minutes","Often","Never","Always","Always","Often","Rarely","Rarely","Always","Always","Always","Severe","Always"),
("3/27/2026","kneilcanete@gmail.com",21,"Male","1st Year","Other","2–4 hours","More than 7 hours","Smartphone","More than 3 hours","3–4","Every 20 minutes","More than 8 hours","Never","Sometimes","Low","Always","20–40 cm","No","Every 20 minutes","Sometimes","Sometimes","Often","Sometimes","Rarely","Never","Rarely","Sometimes","Sometimes","Sometimes","Mild","Rarely"),
("3/27/2026","cpacayragiliannanicole@gmail.com",17,"Female","2nd Year","Health Sciences","Less than 2 hours","More than 7 hours","Smartphone","30–60 minutes","1–2","Every 20 minutes","Less than 5 hours","Never","Never","Low","Always","Less than 20 cm","No","Every 20 minutes","Sometimes","Sometimes","Often","Often","Rarely","Always","Sometimes","Always","Always","Often","Mild","Rarely"),
("3/27/2026","lambinowill@gmail.com",17,"Male","1st Year","Health Sciences","6–8 hours","3–5 hours","Laptop","More than 3 hours","1–2","Every 30–60 minutes","Less than 5 hours","Rarely","Rarely","Medium","Sometimes","20–40 cm","No","Every 30–60 minutes","Rarely","Sometimes","Sometimes","Rarely","Never","Never","Rarely","Never","Never","Sometimes","None","Rarely"),
("3/27/2026","krizzelemeraveles32@gmail.com",17,"Female","1st Year","Other","6–8 hours","3–5 hours","Smartphone","30–60 minutes","1–2","Every 30–60 minutes","Less than 5 hours","Never","Always","Low","Always","Less than 20 cm","No","Every 30–60 minutes","Sometimes","Rarely","Sometimes","Sometimes","Rarely","Never","Never","Often","Often","Rarely","Mild","Sometimes"),
("3/28/2026","voosorio5172qc@student.fatima.edu.ph",17,"Female","1st Year","Other","2–4 hours","1–3 hours","Smartphone","30–60 minutes","1–2","Every 30–60 minutes","5–6 hours","Rarely","Always","Low","Always","Less than 20 cm","No","Every 30–60 minutes","Never","Never","Never","Sometimes","Never","Never","Never","Sometimes","Rarely","Never","Mild","Sometimes"),
("3/28/2026","odgienm@gmail.com",17,"Female","1st Year","Health Sciences","Less than 2 hours","More than 7 hours","Smartphone","More than 3 hours","1–2","Rarely take breaks","More than 8 hours","Never","Rarely","Low","Always","Less than 20 cm","No","Rarely take breaks","Rarely","Rarely","Never","Rarely","Rarely","Sometimes","Never","Always","Often","Rarely","Mild","Sometimes"),
("4/2/2026","jairusgiolopido@gmail.com",17,"Male","1st Year","Other","2–4 hours","More than 7 hours","Smartphone","2–3 hours","1–2","Every 30–60 minutes","7–8 hours","Never","Always","Low","Always","20–40 cm","No","Every 30–60 minutes","Rarely","Rarely","Rarely","Often","Sometimes","Rarely","Sometimes","Never","Rarely","Never","Moderate","Sometimes"),
("4/6/2026","johlinevillalino.0427@gmail.com",19,"Female","2nd Year","Education","4–6 hours","5–7 hours","Smartphone","30–60 minutes","None","Every 30–60 minutes","More than 8 hours","Never","Always","Low","Sometimes","20–40 cm","No","Every 30–60 minutes","Often","Rarely","Always","Rarely","Rarely","Rarely","Rarely","Rarely","Rarely","Rarely","Mild","Rarely"),
("4/6/2026","mikecleodeguzman21@gmail.com",19,"Male","3rd Year","Other","4–6 hours","More than 7 hours","Smartphone","1–2 hours","1–2","Every 1–2 hours","5–6 hours","Never","Never","High","Always","20–40 cm","Yes","Every 1–2 hours","Sometimes","Sometimes","Rarely","Sometimes","Sometimes","Often","Sometimes","Never","Rarely","Rarely","Mild","Sometimes"),
("4/6/2026","nightumerukurumin@gmail.com",19,"Female","1st Year","Arts and Humanities","Less than 2 hours","More than 7 hours","Smartphone","Less than 30 minutes","None","Rarely take breaks","Less than 5 hours","Always","Never","Medium","Always","Less than 20 cm","Yes","Rarely take breaks","Always","Always","Always","Always","Always","Always","Always","Always","Always","Always","Severe","Always"),
("4/6/2026","naomidylanang@gmail.com",21,"Female","3rd Year","Other","6–8 hours","More than 7 hours","Smartphone","2–3 hours","1–2","Every 30–60 minutes","5–6 hours","Rarely","Always","Medium","Always","20–40 cm","No","Every 30–60 minutes","Rarely","Sometimes","Always","Sometimes","Never","Rarely","Sometimes","Often","Sometimes","Sometimes","Mild","Rarely"),
("4/6/2026","selwynumali41@gmail.com",21,"Male","2nd Year","IT / Computer Science","More than 8 hours","More than 7 hours","Smartphone","More than 3 hours","None","Rarely take breaks","5–6 hours","Never","Always","Low","Sometimes","20–40 cm","Yes","Rarely take breaks","Rarely","Often","Always","Sometimes","Rarely","Sometimes","Sometimes","Always","Always","Often","Severe","Always"),
("4/6/2026","miaabainza@gmail.com",19,"Female","2nd Year","IT / Computer Science","6–8 hours","3–5 hours","Smartphone","2–3 hours","5 or more","Every 1–2 hours","Less than 5 hours","Rarely","Sometimes","Low","Always","20–40 cm","No","Every 1–2 hours","Sometimes","Sometimes","Rarely","Sometimes","Often","Always","Rarely","Always","Always","Often","Mild","Often"),
("4/6/2026","ang.francesca05@gmail.com",17,"Female","1st Year","Business","4–6 hours","More than 7 hours","Tablet","More than 3 hours","1–2","Rarely take breaks","5–6 hours","Sometimes","Sometimes","Low","Always","Less than 20 cm","No","Rarely take breaks","Never","Often","Never","Often","Rarely","Often","Rarely","Often","Rarely","Rarely","None","Rarely"),
("4/6/2026","ofianaaxl01@gmail.com",21,"Male","3rd Year","Business","2–4 hours","1–3 hours","Smartphone","1–2 hours","1–2","Every 1–2 hours","5–6 hours","Rarely","Rarely","Medium","Sometimes","20–40 cm","Yes","Every 1–2 hours","Never","Never","Never","Never","Never","Never","Never","Never","Never","Never","Mild","Rarely"),
("4/6/2026","jamesybanez99@gmail.com",19,"Male","2nd Year","IT / Computer Science","4–6 hours","More than 7 hours","Smartphone","More than 3 hours","1–2","Every 1–2 hours","7–8 hours","Never","Sometimes","Medium","Sometimes","20–40 cm","No","Every 1–2 hours","Never","Never","Always","Sometimes","Rarely","Never","Rarely","Rarely","Sometimes","Sometimes","Moderate","Sometimes"),
("4/6/2026","alniharmacasalong@gmail.com",19,"Female","3rd Year","Other","6–8 hours","More than 7 hours","Smartphone","More than 3 hours","None","Every 30–60 minutes","Less than 5 hours","Rarely","Sometimes","Medium","Always","20–40 cm","No","Every 30–60 minutes","Often","Often","Rarely","Never","Always","Sometimes","Rarely","Rarely","Often","Always","Moderate","Often"),
("4/6/2026","angkentarvin@gmail.com",19,"Male","1st Year","IT / Computer Science","2–4 hours","More than 7 hours","Laptop","More than 3 hours","3–4","Rarely take breaks","Less than 5 hours","Rarely","Never","Low","Always","20–40 cm","No","Rarely take breaks","Rarely","Rarely","Rarely","Rarely","Rarely","Rarely","Rarely","Sometimes","Sometimes","Sometimes","Moderate","Often"),
("4/6/2026","villalinojebby@gmail.com",23,"Female","3rd Year","Business","4–6 hours","More than 7 hours","Laptop","1–2 hours","None","Every 1–2 hours","7–8 hours","Rarely","Always","Medium","Sometimes","40–60 cm","Yes","Every 1–2 hours","Rarely","Rarely","Often","Never","Never","Never","Never","Never","Never","Never","Mild","Never"),
("4/6/2026","soulhunter2628@gmail.com",19,"Prefer not to say","2nd Year","Business","2–4 hours","5–7 hours","Tablet","2–3 hours","None","Every 30–60 minutes","7–8 hours","Rarely","Always","Medium","Sometimes","20–40 cm","Yes","Every 30–60 minutes","Never","Never","Rarely","Never","Sometimes","Never","Often","Never","Often","Often","None","Rarely"),
("4/6/2026","stephabiera10@gmail.com",19,"Female","2nd Year","Business","2–4 hours","More than 7 hours","Smartphone","30–60 minutes","None","Every 1–2 hours","7–8 hours","Rarely","Always","Low","Always","20–40 cm","No","Every 1–2 hours","Sometimes","Sometimes","Sometimes","Sometimes","Rarely","Sometimes","Sometimes","Sometimes","Rarely","Rarely","Mild","Never"),
("4/6/2026","odtohan.marriane@ncst.edu.ph",19,"Female","2nd Year","Business","2–4 hours","3–5 hours","Smartphone","1–2 hours","None","Every 30–60 minutes","5–6 hours","Never","Always","Medium","Always","40–60 cm","No","Every 30–60 minutes","Rarely","Often","Sometimes","Often","Sometimes","Never","Rarely","Often","Sometimes","Rarely","Mild","Rarely"),
("4/6/2026","kiritosaimas@gmail.com",23,"Male","4th Year","Other","4–6 hours","3–5 hours","Laptop","More than 3 hours","5 or more","Rarely take breaks","More than 8 hours","Never","Always","Medium","Never","More than 60 cm","No","Rarely take breaks","Sometimes","Sometimes","Sometimes","Sometimes","Sometimes","Sometimes","Sometimes","Sometimes","Sometimes","Sometimes","Mild","Sometimes"),
("4/6/2026","jorielinelacasa0@gmail.com",19,"Female","2nd Year","Business","Less than 2 hours","1–3 hours","Smartphone","30–60 minutes","None","Every 30–60 minutes","7–8 hours","Sometimes","Sometimes","Low","Sometimes","20–40 cm","No","Every 30–60 minutes","Never","Rarely","Rarely","Rarely","Never","Never","Never","Rarely","Rarely","Never","None","Never"),
("4/6/2026","jhonreyrcostin@gmail.com",19,"Male","3rd Year","Business","2–4 hours","3–5 hours","Smartphone","30–60 minutes","None","Every 1–2 hours","7–8 hours","Sometimes","Always","Medium","Sometimes","20–40 cm","No","Every 1–2 hours","Sometimes","Often","Sometimes","Often","Sometimes","Sometimes","Sometimes","Often","Often","Often","Mild","Sometimes"),
("4/6/2026","bsned.delrosariojanellemae@gmail.com",19,"Female","2nd Year","Education","4–6 hours","More than 7 hours","Smartphone","More than 3 hours","None","Rarely take breaks","7–8 hours","Rarely","Always","Medium","Always","20–40 cm","No","Rarely take breaks","Rarely","Rarely","Rarely","Rarely","Never","Rarely","Rarely","Rarely","Rarely","Sometimes","Mild","Rarely"),
]

if __name__ == "__main__":
    print(f"Starting import of {len(ROWS)} survey rows...")
    success = 0
    failed = 0

    for i, row in enumerate(ROWS):
        try:
            data = build(row)
            resp = requests.post(INSERT_URL, headers=HEADERS, json=data, timeout=15)
            if resp.status_code in (200, 201):
                success += 1
                print(f"  [{i+1}/{len(ROWS)}] OK — {data.get('email') or 'no-email'} ({data['date']})")
            else:
                failed += 1
                print(f"  [{i+1}/{len(ROWS)}] FAILED — {resp.status_code}: {resp.text[:120]}")
        except Exception as e:
            failed += 1
            print(f"  [{i+1}/{len(ROWS)}] FAILED — {e}")

    print(f"\nDone. {success} inserted, {failed} failed.")
