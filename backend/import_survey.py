"""
Survey Data Importer
Reads the Google Forms CSV and inserts rows into Supabase daily_logs table.
Run from the backend folder:
    python import_survey.py
"""

import os
from datetime import datetime
from supabase import create_client

# ── Supabase connection ───────────────────────────────────────────────────────
SUPABASE_URL = "https://vpfzjysugqrnshfzsaex.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZnpqeXN1Z3FybnNoZnpzYWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MDQ2NCwiZXhwIjoyMDkzNTY2NDY0fQ.qdi36Xq_5_itsNWw3uMEQwMNbaeElaR9qvO-bsif3qA"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ── Mapping helpers ───────────────────────────────────────────────────────────

def map_screen_time(val):
    """Convert screen time range string to float hours."""
    m = {
        "Less than 2 hours": 1.0,
        "2–4 hours": 3.0,
        "4–6 hours": 5.0,
        "6–8 hours": 7.0,
        "More than 8 hours": 9.0,
    }
    return m.get(val, 3.0)

def map_sleep(val):
    m = {
        "Less than 5 hours": 4.0,
        "5–6 hours": 5.5,
        "7–8 hours": 7.5,
        "More than 8 hours": 9.0,
    }
    return m.get(val, 6.0)

def map_breaks(val):
    """Convert break frequency to estimated number of breaks."""
    m = {
        "Rarely take breaks": 0,
        "Every 20 minutes": 6,
        "Every 30–60 minutes": 4,
        "Every 1–2 hours": 2,
    }
    return m.get(val, 2)

def map_symptom(val):
    """Convert frequency string to 0/1 presence flag."""
    return 0 if val in ("Never", "Rarely", "") else 1

def map_frequency(val):
    """Keep frequency string as-is for the _frequency columns."""
    return val if val else "Never"

def map_risk(val):
    m = {
        "None": "Low",
        "Mild": "Low",
        "Moderate": "Moderate",
        "Severe": "High",
        "High": "High",
        "Low": "Low",
        "Medium": "Moderate",
    }
    return m.get(val, "Moderate")

def map_brightness(distance):
    """Estimate brightness from viewing distance."""
    m = {
        "Less than 20 cm": 85,
        "20–40 cm": 70,
        "40–60 cm": 60,
        "More than 60 cm": 50,
    }
    return m.get(distance, 70)


# ── Survey data (all 70 rows) ─────────────────────────────────────────────────
# Columns: timestamp, email, age, gender, year, field, academic_screen_time,
#          non_academic_screen_time, primary_device, homework_device_time,
#          breaks_per_session, break_frequency, sleep_hours_range,
#          q14, q15, overall_discomfort, q17, viewing_distance, blue_light,
#          break_pattern,
#          dry_eyes_freq, eye_itch_freq, blurred_vision_freq, headache_freq,
#          eye_irritation_freq, light_sensitivity_freq, difficulty_focus_freq,
#          neck_pain_freq, mental_tired_freq, difficulty_conc_freq,
#          overall_severity, symptom_frequency_overall

SURVEY_ROWS = [
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
]

SURVEY_ROWS += [
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
]

SURVEY_ROWS += [
    ("3/27/2026","acedanielpanesa18@gmail.com",21,"Male","3rd Year","IT / Computer Science","6–8 hours","More than 7 hours","Laptop","2–3 hours","3–4","Every 30–60 minutes","Less than 5 hours","Never","Never","Medium","Always","20–40 cm","Yes","Every 30–60 minutes","Sometimes","Often","Always","Sometimes","Often","Never","Never","Often","Rarely","Sometimes","Moderate","Often"),
    ("3/27/2026","francheskarmataya12@gmail.com",19,"Female","1st Year","Other","4–6 hours","3–5 hours","Tablet","More than 3 hours","1–2","Every 20 minutes","More than 8 hours","Rarely","Rarely","Medium","Always","20–40 cm","Yes","Every 20 minutes","Rarely","Sometimes","Never","Sometimes","Rarely","Rarely","Sometimes","Sometimes","Sometimes","Sometimes","Moderate","Sometimes"),
    ("3/27/2026","joannamaytalino77@gmail.com",19,"Female","1st Year","Other","4–6 hours","5–7 hours","Smartphone","30–60 minutes","1–2","Every 1–2 hours","5–6 hours","Sometimes","Sometimes","Low","Sometimes","Less than 20 cm","Yes","Every 1–2 hours","Rarely","Rarely","Sometimes","Rarely","Sometimes","Sometimes","Sometimes","Rarely","Never","Sometimes","Mild","Sometimes"),
    ("3/27/2026","gradoagelkate@gmail.com",19,"Female","1st Year","Other","2–4 hours","1–3 hours","Smartphone","More than 3 hours","1–2","Rarely take breaks","Less than 5 hours","Never","Always","Low","Always","20–40 cm","Yes","Rarely take breaks","Never","Never","Sometimes","Sometimes","Never","Sometimes","Sometimes","Sometimes","Sometimes","Never","Mild","Sometimes"),
    ("3/27/2026","princessatinguin177@gmail.com",17,"Female","1st Year","Other","Less than 2 hours","1–3 hours","Laptop","30–60 minutes","3–4","Every 30–60 minutes","More than 8 hours","Never","Never","Low","Never","20–40 cm","No","Every 30–60 minutes","Sometimes","Sometimes","Always","Sometimes","Sometimes","Always","Rarely","Always","Always","Sometimes","Mild","Sometimes"),
    ("3/27/2026","riveraarvie45@gmail.com",17,"Female","1st Year","Health Sciences","6–8 hours","5–7 hours","Smartphone","2–3 hours","None","Every 30–60 minutes","Less than 5 hours","Rarely","Always","Medium","Sometimes","20–40 cm","Yes","Every 30–60 minutes","Sometimes","Sometimes","Often","Often","Sometimes","Rarely","Rarely","Sometimes","Often","Sometimes","Mild","Sometimes"),
    ("3/27/2026","salvatierraeurica@gmail.com",17,"Female","1st Year","Other","Less than 2 hours","More than 7 hours","Smartphone","More than 3 hours","1–2","Rarely take breaks","5–6 hours","Never","Always","Medium","Sometimes","20–40 cm","No","Rarely take breaks","Never","Rarely","Often","Often","Often","Sometimes","Never","Sometimes","Always","Always","Moderate","Often"),
    ("3/27/2026","saysonchristelnovie@gmail.com",17,"Female","1st Year","Other","4–6 hours","5–7 hours","Smartphone","1–2 hours","None","Every 1–2 hours","5–6 hours","Sometimes","Sometimes","Low","Sometimes","20–40 cm","No","Every 1–2 hours","Often","Often","Rarely","Sometimes","Sometimes","Often","Rarely","Always","Always","Sometimes","Mild","Sometimes"),
    ("3/27/2026","prinzjoseffloreza0916@gmail.com",17,"Male","1st Year","Other","2–4 hours","3–5 hours","Smartphone","30–60 minutes","1–2","Every 30–60 minutes","7–8 hours","Rarely","Sometimes","Medium","Sometimes","20–40 cm","No","Every 30–60 minutes","Never","Never","Never","Never","Never","Never","Rarely","Never","Never","Rarely","None","Rarely"),
    ("3/27/2026","ljreyes0103@gmail.com",19,"Prefer not to say","1st Year","Other","4–6 hours","More than 7 hours","Smartphone","1–2 hours","3–4","Every 20 minutes","5–6 hours","Sometimes","Never","Medium","Sometimes","20–40 cm","Yes","Every 20 minutes","Sometimes","Often","Rarely","Rarely","Rarely","Sometimes","Rarely","Sometimes","Sometimes","Rarely","Mild","Sometimes"),
    ("3/27/2026","galangclarkjohn@gmail.com",19,"Male","1st Year","Other","Less than 2 hours","5–7 hours","Smartphone","2–3 hours","1–2","Every 30–60 minutes","Less than 5 hours","Never","Sometimes","Medium","Sometimes","20–40 cm","No","Every 30–60 minutes","Sometimes","Sometimes","Rarely","Rarely","Often","Rarely","Sometimes","Rarely","Often","Always","Moderate","Sometimes"),
]

SURVEY_ROWS += [
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
]

SURVEY_ROWS += [
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
]

SURVEY_ROWS += [
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


# ── Build and insert rows ─────────────────────────────────────────────────────

def build_row(r):
    """Convert one survey tuple into a daily_logs dict."""
    (date_str, email, age, gender, year_level, field,
     academic_st, non_academic_st, device, homework_time,
     breaks_per_session, break_pattern, sleep_range,
     q14, q15, overall_discomfort, q17, viewing_distance, blue_light,
     break_freq,
     dry_eyes_f, eye_itch_f, blurred_f, headache_f,
     eye_irrit_f, light_sens_f, diff_focus_f,
     neck_pain_f, mental_tired_f, diff_conc_f,
     overall_severity, symptom_freq_overall) = r

    screen_time = map_screen_time(academic_st)
    sleep_hours = map_sleep(sleep_range)
    breaks_taken = map_breaks(break_pattern)
    brightness = map_brightness(viewing_distance)
    risk_level = map_risk(overall_severity)

    # Symptom presence flags
    eye_strain   = map_symptom(dry_eyes_f) or map_symptom(eye_itch_f) or map_symptom(diff_focus_f)
    headaches    = map_symptom(headache_f)
    blurry_vision = map_symptom(blurred_f)
    dry_eyes     = map_symptom(dry_eyes_f)

    # Parse date
    try:
        date_obj = datetime.strptime(date_str.strip(), "%m/%d/%Y").date()
    except Exception:
        date_obj = datetime.today().date()

    return {
        "user_id": None,  # Survey imports don't have auth users
        "date": str(date_obj),
        "email": email or None,
        "age": int(age),
        "gender": gender,
        "year_level": year_level,
        "field_of_study": field,
        "academic_screen_time": academic_st,
        "non_academic_screen_time": non_academic_st,
        "screen_time": screen_time,
        "primary_device": device,
        "breaks_taken": breaks_taken,
        "eye_strain": int(eye_strain),
        "eye_strain_frequency": dry_eyes_f,
        "headaches": int(headaches),
        "headaches_frequency": headache_f,
        "blurry_vision": int(blurry_vision),
        "blurry_vision_frequency": blurred_f,
        "dry_eyes": int(dry_eyes),
        "dry_eyes_frequency": dry_eyes_f,
        "brightness": brightness,
        "sleep_hours": sleep_hours,
        "notes": f"Imported from survey. Overall severity: {overall_severity}. Symptom freq: {symptom_freq_overall}.",
        "risk_level": risk_level,
    }


def run_import():
    print(f"Starting import of {len(SURVEY_ROWS)} survey rows...")
    success = 0
    failed = 0

    for i, row in enumerate(SURVEY_ROWS):
        try:
            data = build_row(row)
            # Use upsert so re-running the script won't create duplicates
            result = supabase.table("daily_logs").insert(data).execute()
            success += 1
            print(f"  [{i+1}/{len(SURVEY_ROWS)}] OK — {data['email'] or 'no-email'} ({data['date']})")
        except Exception as e:
            failed += 1
            print(f"  [{i+1}/{len(SURVEY_ROWS)}] FAILED — {e}")

    print(f"\nDone. {success} inserted/updated, {failed} failed.")


if __name__ == "__main__":
    run_import()
