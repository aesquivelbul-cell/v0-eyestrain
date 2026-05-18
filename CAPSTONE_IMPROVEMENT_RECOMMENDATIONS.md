# EyeGuard Capstone - Improvement & Enhancement Recommendations

Based on your proposal and chapter documents, here are critical recommendations for your system.

---

## CRITICAL: Continuous Model Training (MOST IMPORTANT FOR YOUR PROFESSOR)

Your documents state the system should use "machine learning" but you currently only have synthetic/static data. Your professor will ask: **"Does your model learn from real user data over time?"**

### Current State ❌
- Model is static (hardcoded weights)
- Only uses synthetic training data
- No adaptation to real user patterns
- Model doesn't improve as more data is collected

### What You NEED ✅

#### 1. **Continuous Learning Pipeline**
Create a new API endpoint that periodically retrains the model with real database data:

```typescript
// app/api/ml/retrain-model/route.ts
export async function POST(request: Request) {
  try {
    const supabase = createServerClient(...);
    
    // Fetch all user data from database
    const { data: allLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (!allLogs || allLogs.length < 50) {
      return NextResponse.json({ 
        message: 'Insufficient data for retraining (need 50+ samples)' 
      });
    }
    
    // Calculate new model weights based on real data
    const weights = calculateWeightsFromData(allLogs);
    
    // Store updated weights in database
    await updateModelWeights(weights);
    
    return NextResponse.json({ 
      success: true,
      dataPointsUsed: allLogs.length,
      newWeights: weights,
      timestamp: new Date()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateWeightsFromData(logs: DailyLog[]) {
  // Analyze correlation between inputs and actual outcomes
  const screenTimeCorrelation = calculateCorrelation(
    logs.map(l => l.screen_time),
    logs.map(l => calculateActualRisk(l))
  );
  
  return {
    screenTimeWeight: screenTimeCorrelation,
    symptomWeight: calculateSymptomWeight(logs),
    sleepWeight: calculateSleepWeight(logs),
    breakWeight: calculateBreakWeight(logs),
    brightnessWeight: calculateBrightnessWeight(logs),
    lastTrained: new Date(),
    dataPointsUsed: logs.length,
    accuracy: calculateModelAccuracy(logs)
  };
}
```

#### 2. **Model Accuracy Tracking**
Add a new database table to track model performance:

```sql
CREATE TABLE model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  data_points_used INTEGER,
  accuracy DECIMAL(3,2),
  precision DECIMAL(3,2),
  recall DECIMAL(3,2),
  weights JSON,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. **Model Versioning**
Keep track of model iterations:

```typescript
interface ModelVersion {
  version: number;
  weights: {
    screenTimeWeight: number;
    symptomWeight: number;
    sleepWeight: number;
    breakWeight: number;
    brightnessWeight: number;
  };
  trainedOn: number; // data points
  accuracy: number;
  createdAt: Date;
  dataRange: {
    from: Date;
    to: Date;
  };
}
```

#### 4. **Display Model Improvement Progress**
Create a new page `/app/model-progress/page.tsx`:

```typescript
export default function ModelProgressPage() {
  const [modelMetrics, setModelMetrics] = useState<ModelVersion[]>([]);
  const [improvement, setImprovement] = useState<number>(0);
  
  // Show how model accuracy has improved over time
  // Show number of real data points used in training
  // Display current weights being used
  // Show when model was last updated
}
```

---

## Critical Gaps Based on Your Proposal

### 1. **Data Validation & Quality Control** ⚠️

Your proposal mentions "self-reported data may have inaccuracies" but you don't validate it.

**Add:**
```typescript
function validateUserInput(data: FormData): ValidationResult {
  const issues = [];
  
  // Screen time sanity check
  if (data.screenTime > 20) {
    issues.push("Screen time > 20 hours seems unrealistic");
  }
  
  // Sleep hours validation
  if (data.sleepHours < 2 || data.sleepHours > 16) {
    issues.push("Sleep hours outside normal range");
  }
  
  // Consistency check - compare with previous entries
  if (data.screenTime > previousDay.screenTime * 2) {
    issues.push("Significant jump from yesterday - verify data");
  }
  
  return {
    isValid: issues.length === 0,
    warnings: issues
  };
}
```

### 2. **Model Explainability** (Your Professor WILL Ask This)

Show WHY the model made a prediction:

```typescript
interface RiskExplanation {
  riskLevel: string;
  riskPercentage: number;
  factors: {
    screenTime: { contribution: 35%, impact: "HIGH" },
    symptoms: { contribution: 25%, impact: "MEDIUM" },
    sleepQuality: { contribution: 20%, impact: "HIGH" },
    breakBehavior: { contribution: 10%, impact: "LOW" },
    brightness: { contribution: 10%, impact: "LOW" }
  };
  topRiskFactors: string[];
  recommendations: string[];
  confidence: number;
}
```

Add this to your risk-prediction page to show users exactly what caused their risk score.

### 3. **Long-term Trend Analysis**

Your proposal says evaluation "does not account for long-term user behavior" - you need this:

```typescript
// app/api/ml/trends/route.ts
// Calculate user improvement over 30, 60, 90 days
// Show if they're getting better or worse
// Track symptom reduction
// Show effectiveness of recommendations
```

---

## Features to Add for Your Capstone

### Priority 1 (MUST HAVE for presentation)
- [ ] **Model Training Status Dashboard** - Show when model was last trained, how many data points used
- [ ] **Continuous Learning API** - Retrain model weekly with accumulated data
- [ ] **Model Metrics Page** - Display accuracy, confidence, improvements over time
- [ ] **Data Quality Indicators** - Show how many data points collected vs needed
- [ ] **Model Explainability** - Show what factors caused each prediction

### Priority 2 (IMPORTANT)
- [ ] **Export Model Weights** - Allow professor to download current model for analysis
- [ ] **Prediction Confidence Score** - Show how confident the model is (already have this, improve it)
- [ ] **Batch Prediction** - Show how model performs on multiple users
- [ ] **Input Validation Warnings** - Alert users if their input seems unusual
- [ ] **Model Version History** - Track every iteration of the model

### Priority 3 (NICE TO HAVE)
- [ ] **Anomaly Detection** - Flag unusual data patterns
- [ ] **A/B Testing Framework** - Test different model versions
- [ ] **User Feedback Loop** - Let users correct predictions
- [ ] **Privacy-Preserving Analytics** - Show trends without identifying users
- [ ] **Model Comparison Tool** - Compare synthetic vs real data models

---

## Implementation Steps

### Week 1: Continuous Learning
1. Create `ModelWeights` table in Supabase
2. Create `/api/ml/retrain-model` endpoint
3. Add scheduled job to retrain weekly

### Week 2: Tracking & Visualization
1. Create `model_metrics` table
2. Build `/model-progress` page
3. Add metrics to dashboard

### Week 3: Explainability
1. Update prediction response to include explanations
2. Add "Why this risk?" section to UI
3. Create factor breakdown visualization

### Week 4: Polish & Demo
1. Add data quality warnings
2. Create export functionality
3. Prepare presentation materials

---

## What to Tell Your Professor

**Current Implementation:**
"Our system collects daily data from students about screen time, symptoms, sleep, and device usage. This data is fed into a machine learning model that analyzes 5 weighted factors (screen time: 35%, symptoms: 25%, sleep: 20%, breaks: 10%, brightness: 10%) to predict eye strain risk with a confidence score."

**What Makes Yours Special:**
1. **Real-world data collection** - Not just synthetic data
2. **Continuous improvement** - Model retrains as more data comes in
3. **Risk explainability** - Users see exactly what caused their risk score
4. **Multi-factor analysis** - Not just screen time, but holistic approach
5. **Personalized recommendations** - Generated based on individual risk factors

**Show Them:**
- How many real users' data the model has trained on
- Model accuracy improvements over time
- Factor contribution breakdown for sample user
- How recommendations change as model learns

---

## Code Structure for Model Training

```
app/
├── api/
│   └── ml/
│       ├── predict/ (exists)
│       ├── retrain-model/ (NEW)
│       ├── metrics/ (NEW)
│       └── weights/ (NEW)
├── model-progress/ (NEW PAGE)
└── dashboard/ (update to show model info)

lib/
├── ml/
│   ├── model-weights.ts (NEW - manage current weights)
│   ├── training.ts (NEW - retraining logic)
│   ├── metrics.ts (NEW - calculate accuracy, precision, recall)
│   └── validation.ts (NEW - validate input data quality)

db/
└── migrations/
    ├── create_model_weights_table.sql
    ├── create_model_metrics_table.sql
    └── create_model_versions_table.sql
```

---

## Key Metrics Your Professor Wants to See

1. **Model Accuracy Over Time** - Is it improving?
2. **Data Collection Progress** - How many real data points?
3. **User Population Diversity** - Different types of students?
4. **Confidence Calibration** - Is the model honest about uncertainty?
5. **Recommendation Effectiveness** - Do users report improvement?

---

## Summary

Your current system is GREAT but missing the continuous learning piece that makes it truly "machine learning." The difference between static predictions and adaptive ML is what separates a good capstone from an excellent one.

**Next Step:** Implement the continuous retraining pipeline with model tracking. This shows your professor that you understand ML isn't just about training once—it's about systems that improve with real data over time.
