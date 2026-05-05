# CSV Data Import Guide - EyeGuard

## Quick Start (5 Minutes)

### Step 1: Access Import Page
```
URL: http://localhost:3000/admin/import-data
(or your deployment URL)
```

### Step 2: Upload Survey CSV
1. Click "Choose File"
2. Select the eye strain survey CSV
3. System automatically processes the data
4. See success message with statistics

### Step 3: Login with Imported Data
```
Email: demo_student_1@survey.local
Password: demo123456
```

---

## What Happens During Import

### Data Processing Flow

```
CSV File
   ↓
[Parse CSV Lines]
   ↓
[Map Categorical to Numeric]
   ├─ Screen Time: "2–4 hours" → 3.0
   ├─ Breaks: "Every 30-60 minutes" → 2
   ├─ Symptoms: "Sometimes" → 2
   └─ Sleep: "7–8 hours" → 7.5
   ↓
[Create User Profiles]
   ├─ Extract email
   ├─ Generate name
   ├─ Get age, gender, major
   └─ Set primary device
   ↓
[Create Daily Logs]
   ├─ Calculate risk level
   ├─ Aggregate symptoms
   ├─ Set timestamp
   └─ Add survey metadata
   ↓
[Store in Browser]
   └─ Save to localStorage
   ↓
[Display Results]
   └─ Show import statistics
```

### Data Transformation Examples

**Example 1: Screen Time Mapping**
```
Input: "6–8 hours"
Process: Map to numeric range → 7.0
Output: screenTime = 7.0
```

**Example 2: Symptom Aggregation**
```
Input Survey Responses:
- Dry Eyes: "Sometimes" (2)
- Eye Itchiness: "Rarely" (1)
- Blurred Vision: "Sometimes" (2)
- Headaches: "Often" (3)

Process: Calculate average
- Total: 2+1+2+3 = 8
- Average: 8/4 = 2.0
- Severity: (2.0/4) * 3 = 1.5 → 2 (rounded)

Output: eyeStrain = 2
```

**Example 3: Risk Level Calculation**
```
Input:
- Screen Time: 7 hours
- Breaks: 2 per day
- Symptoms: High (average 3.0/4)
- Sleep: 5.5 hours

Process: Risk calculation
- Screen Time Score: 7 * 10 = 70 points
- Breaks Score: (2 * 5) = 10 points
- Symptom Score: 3.0 * 25 = 75 points
- Sleep Score: 5.5 * 10 = 55 points (low is bad)
- Total Risk: (70 + 10 + 75 + 55) / 4 = 52.5

Output: Risk Level = "Medium"
```

---

## CSV Format Expected

### Column Order

```
1. Timestamp
2. Username/Email
3. Age Range (e.g., "19-20")
4. Gender
5. Year of Study
6. Major/Program
7. Daily Screen Time
8. Weekly Device Usage
9. Primary Device
10. Homework Device Time
11. Break Frequency
12. Sleep Hours
13-22. Symptom Responses (Never/Rarely/Sometimes/Often/Always)
23. Overall Discomfort Level
24. Frequency of Symptoms
```

### Valid Values

**Screen Time Ranges:**
```
- Less than 2 hours
- 2–4 hours
- 4–6 hours
- 6–8 hours
- More than 8 hours
```

**Device Types:**
```
- Smartphone
- Tablet
- Laptop
- Desktop Computer
```

**Symptom Frequency:**
```
- Never
- Rarely
- Sometimes
- Often
- Always
```

**Break Frequency:**
```
- Rarely take breaks
- Every 20 minutes
- Every 30–60 minutes
- Every 1–2 hours
```

**Sleep Hours:**
```
- Less than 5 hours
- 5–6 hours
- 7–8 hours
- More than 8 hours
```

**Overall Discomfort:**
```
- None
- Mild
- Moderate
- Severe
```

---

## After Import: What's Available

### User Accounts Created
- 45+ user accounts from survey respondents
- All users can login with password: `survey123456`
- Emails auto-generated from usernames

### Daily Logs Created
- 1 log per user (survey response date)
- Includes all health metrics
- Ready for dashboard analysis
- Can be used to train ML models

### Sample Data Structure

```json
{
  "user": {
    "id": "user_1234567890",
    "email": "john.doe@survey.local",
    "name": "John Doe",
    "age": 21,
    "gender": "Male",
    "yearOfStudy": "3rd Year",
    "major": "IT / Computer Science",
    "primaryDevice": "Smartphone"
  },
  "dailyLog": {
    "id": "log_987654321",
    "date": "2026-03-18",
    "screenTime": 7,
    "breaksTaken": 2,
    "eyeStrain": 2,
    "headaches": 1,
    "blurryVision": 1,
    "dryEyes": 2,
    "sleepHours": 7.5,
    "riskLevel": "Medium",
    "notes": "Survey response - Smartphone user, IT / Computer Science"
  }
}
```

---

## Accessing Imported Data in Code

### In React Components

```typescript
import { mockAuth } from '@/lib/mock-auth';

export function UserList() {
  useEffect(() => {
    // Get all imported users
    const allUsers = mockAuth.getAllUsers();
    console.log(`Total users: ${allUsers.length}`);
    
    allUsers.forEach(user => {
      console.log(`${user.name} - ${user.major} - Risk: ${user.dailyLogsCount} logs`);
    });
  }, []);
}
```

### Fetch Specific User

```typescript
const user = mockAuth.getUserByEmail('john.doe@survey.local');
console.log(user.dailyLogs[0]); // First daily log
```

### Get All Daily Logs

```typescript
const allUsers = mockAuth.getAllUsers();
const allLogs = allUsers.flatMap(u => {
  const user = mockAuth.getUserByEmail(u.email);
  return user?.dailyLogs || [];
});

console.log(`Total daily logs: ${allLogs.length}`);
```

---

## Data Analysis Examples

### Calculate Statistics

```typescript
// Average screen time
const avgScreenTime = 
  allLogs.reduce((sum, log) => sum + log.screenTime, 0) / allLogs.length;

// Count high-risk users
const highRiskCount = allLogs.filter(log => log.riskLevel === 'High').length;

// Average symptoms
const avgSymptoms = 
  allLogs.reduce((sum, log) => 
    sum + (log.eyeStrain + log.headaches + log.blurryVision + log.dryEyes), 0) 
  / (allLogs.length * 4);

// Group by major
const byMajor = allUsers.reduce((acc, user) => {
  if (!acc[user.major]) acc[user.major] = [];
  acc[user.major].push(user);
  return acc;
}, {});

console.log(`Users in IT: ${byMajor['IT / Computer Science']?.length || 0}`);
```

### Identify Patterns

```typescript
// Users with high screen time AND low sleep
const atRisk = allUsers.filter(user => {
  const log = user.dailyLogs?.[0];
  return log && log.screenTime >= 7 && log.sleepHours <= 6;
});

console.log(`High risk: ${atRisk.length} users`);

// Most common symptoms
const symptoms = {};
allLogs.forEach(log => {
  if (log.eyeStrain >= 2) symptoms['Eye Strain'] = (symptoms['Eye Strain'] || 0) + 1;
  if (log.headaches >= 2) symptoms['Headaches'] = (symptoms['Headaches'] || 0) + 1;
  if (log.dryEyes >= 2) symptoms['Dry Eyes'] = (symptoms['Dry Eyes'] || 0) + 1;
});

Object.entries(symptoms)
  .sort((a, b) => b[1] - a[1])
  .forEach(([symptom, count]) => {
    console.log(`${symptom}: ${count} users`);
  });
```

---

## Troubleshooting

### Import Failed: "Invalid CSV Format"
**Solution:**
- Ensure file is plain text CSV, not Excel
- Check that all required columns are present
- Verify no special characters in headers

### No Users Created
**Solution:**
- Check browser console for errors
- Verify CSV has data rows (not just headers)
- Try sample import first
- Clear browser cache and try again

### Can't Login After Import
**Solution:**
```
Email format: username@survey.local
Password: survey123456 (default)
Or: import123456 if modified during import
```

### Data Not Showing in Dashboard
**Solution:**
- Refresh the page (F5)
- Check browser localStorage: `eyeguard_users`
- Verify user is logged in
- Check browser console for errors

---

## Next Steps After Import

### 1. Explore the Dashboard
```
URL: /dashboard
- View your metrics
- See health trends
- Check risk predictions
```

### 2. View Analytics
```
URL: /analytics
- Filter by date range
- Download reports
- See aggregate statistics
```

### 3. Log Daily Health
```
URL: /daily-log
- Add today's metrics
- Update symptoms
- Get immediate risk assessment
```

### 4. Check Predictions
```
URL: /risk-prediction
- View risk factors
- See 7-day forecast
- Get recommendations
```

### 5. View Trends
```
URL: /trends
- Long-term patterns
- Device impact analysis
- Sleep correlation
```

---

## Exporting Data

### From Browser Storage
```javascript
// In browser console
const users = JSON.parse(localStorage.getItem('eyeguard_users'));
console.log(JSON.stringify(users, null, 2));

// Download as JSON
const dataStr = JSON.stringify(users, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'eyeguard_data.json';
link.click();
```

### Convert to CSV
```typescript
function usersToCSV(users) {
  const headers = ['Email', 'Name', 'Major', 'Screen Time', 'Risk Level'];
  const rows = users.map(u => [
    u.email,
    u.name,
    u.major,
    u.dailyLogs?.[0]?.screenTime || 'N/A',
    u.dailyLogs?.[0]?.riskLevel || 'N/A',
  ]);
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}
```

---

## Support

### Documentation
- Full guide: `/DATA_IMPORT_AND_RECOMMENDATIONS.md`
- System guide: `/README.md`
- Quick start: `/QUICK_START.md`

### Import Page
- URL: `/admin/import-data`
- Features: CSV upload, sample data, progress tracking

### Test Accounts (After Import)
```
Email: demo_student_1@survey.local
Password: demo123456

Email: demo_student_2@survey.local
Password: demo123456

Email: demo_student_3@survey.local
Password: demo123456
```

---

## Success Checklist

- [ ] CSV file uploaded successfully
- [ ] 45+ users created
- [ ] 45+ daily logs created
- [ ] Can login with imported account
- [ ] Dashboard displays user data
- [ ] Analytics show statistics
- [ ] Risk predictions working
- [ ] Mobile view responsive

**Once all checked: System is ready for use!** 🎉
