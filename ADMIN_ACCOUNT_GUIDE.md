# Admin Account Guide

## Admin Account Credentials

**Email:** `admin@eyeguard.local`  
**Password:** `admin123456`

## What Can Admin Do?

- Access the Data Import page at `/admin/import-data`
- Upload CSV files with survey data
- Bulk import user accounts
- Generate daily health logs
- View import statistics and progress

## How to Access Admin Panel

### Step 1: Go to Login
- Navigate to `/login`
- Enter admin credentials:
  - Email: `admin@eyeguard.local`
  - Password: `admin123456`

### Step 2: Access Import Page
- After logging in, go to `/admin/import-data`
- Or click "Import Data" button on the landing page

### Step 3: Import Data
- Upload your CSV file
- System automatically:
  - Parses the survey data
  - Creates user accounts
  - Generates daily logs
  - Calculates risk scores

## Security Notes

⚠️ **Important:** This is a demo system using browser storage. The admin account credentials are:
- Stored in code (for demo purposes)
- Not encrypted (for development only)
- Should be replaced with secure authentication in production

## Admin Features

### 1. CSV Upload
- Select survey CSV file
- Real-time upload progress
- Validation and error handling

### 2. Data Transformation
- Parses survey responses
- Maps values to numeric scales
- Creates user profiles
- Generates daily logs

### 3. Import Statistics
- Shows number of users imported
- Shows number of logs created
- Displays success/error messages
- Provides test credentials

### 4. Test Data
After importing, test accounts are created:
- Email: `demo_student_1@survey.local`
- Email: `demo_student_2@survey.local`
- Email: `demo_student_3@survey.local`
- etc.

All test accounts use password: `demo123456`

## What Gets Imported?

For each survey respondent:
- User account (email, name, age, major, device)
- Daily health log
- Screen time data
- Symptom information
- Sleep and break data
- Risk assessment

## Next Steps

1. Login as admin
2. Upload your CSV file
3. Wait for import to complete
4. Use imported accounts to test the system
5. View data in Dashboard and Analytics

## Production Deployment

For production:
1. Replace mock authentication with real auth service
2. Use encrypted password storage
3. Implement proper admin role validation
4. Add audit logging for admin actions
5. Use secure database instead of localStorage
6. Implement access controls

## Troubleshooting

**Can't access import page?**
- Make sure you're logged in as admin
- Check email is `admin@eyeguard.local`
- Verify password is `admin123456`

**Import failing?**
- Check CSV format matches expected fields
- Ensure all required columns are present
- Verify file is not corrupted

**No test accounts showing?**
- Refresh the page
- Check browser console for errors
- Clear browser cache and reload
