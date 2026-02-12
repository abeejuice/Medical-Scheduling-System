# Quick Start Guide - Medical Scheduling System

Get up and running in 15 minutes! ⚡

---

## Step 1: Create Google Sheet (2 min)

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **+ Blank** to create new spreadsheet
3. Name it: `Medical Scheduling System`

---

## Step 2: Open Apps Script Editor (1 min)

1. In your spreadsheet, click **Extensions** → **Apps Script**
2. Apps Script editor opens in new tab
3. Delete the default `Code.gs` content (we'll replace it)

---

## Step 3: Enable Manifest File (1 min)

1. Click the **⚙️ Settings** icon (gear) on left sidebar
2. Check ☑️ **"Show appsscript.json manifest file in editor"**
3. Click **Editor** icon (< >) to return to editor

---

## Step 4: Add Project Files (5 min)

### Add appsscript.json
1. Click on `appsscript.json` in files list
2. Replace contents with:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

### Add Code.gs
1. Click on `Code.gs` in files list
2. Replace with contents from `Code.gs` file

### Add Remaining Files
For each file below, click **+ (Add File)** → **Script**:

1. **Logger** → Paste contents from `Logger.gs`
2. **SheetManager** → Paste contents from `SheetManager.gs`
3. **AuthService** → Paste contents from `AuthService.gs`
4. **Initialize** → Paste contents from `Initialize.gs`
5. **Tests** → Paste contents from `Tests.gs`

**Result**: You should have 6 script files + appsscript.json

---

## Step 5: Save and Name Project (1 min)

1. Click **💾 Save** (or Ctrl+S / Cmd+S)
2. Click **Untitled project** at top
3. Rename to: `Medical Scheduling System`
4. Click **Rename**

---

## Step 6: Authorize Script (2 min)

1. In Apps Script editor, select `onOpen` from function dropdown
2. Click **▶️ Run**
3. Dialog appears: "Authorization required"
4. Click **Review permissions**
5. Choose your Google account
6. Click **Advanced**
7. Click **Go to Medical Scheduling System (unsafe)**
   - This is safe - it's your own script!
8. Click **Allow**

---

## Step 7: Initialize Spreadsheet (2 min)

1. Go back to your **Google Sheet** tab
2. **Refresh the page** (F5 or Cmd+R)
3. You should see new menu: **Medical Scheduling**
4. Click **Medical Scheduling** → **Setup** → **Initialize Spreadsheet**
5. Wait for initialization (~5 seconds)
6. Click **OK** when you see success message

**✅ Verify**: You should now see 4 sheets:
- Faculty
- Schedule
- SwapRequests
- AuditLog

---

## Step 8: Add Sample Data (1 min)

1. Click **Medical Scheduling** → **Setup** → **Add Sample Data**
2. Wait for completion (~3 seconds)
3. Click **OK**

**✅ Verify**: Check that sheets now have data rows

---

## Step 9: Test the System (Optional - 2 min)

1. Click **Medical Scheduling** → **Testing** → **Run All Tests**
2. Wait for tests to complete (~10 seconds)
3. View results dialog

**Expected**: All tests should pass ✅

---

## Step 10: Add Yourself to Faculty Sheet (2 min)

1. Go to **Faculty** sheet
2. Add a new row with your information:

| FacultyID | Name | Email | Department | Specialty | Role | Phone | CreatedDate |
|-----------|------|-------|------------|-----------|------|-------|-------------|
| FAC004 | Your Name | your.email@example.com | Your Dept | Your Spec | Admin | 555-0000 | =NOW() |

**Important**: Use your actual Google account email!

3. Press Enter to save

---

## Step 11: Test Your Access (1 min)

1. Click **Medical Scheduling** → **Testing** → **Test Services**
2. Dialog should show your name, email, and role
3. Click **OK**

**✅ Success!** You're now authenticated in the system.

---

## You're Done! 🎉

Your Medical Scheduling System is ready to use!

---

## What You Can Do Now

### As Admin
- **View All Schedules**: Medical Scheduling → Admin → View All Schedules
- **Manage Faculty**: Medical Scheduling → Admin → Manage Faculty
- **Review Swap Requests**: (Coming in Phase 2)

### As Faculty
- **View My Schedule**: Medical Scheduling → Faculty → View My Schedule
- **Request Schedule Swap**: (Coming in Phase 2)

### For Development
- **Run Tests**: Medical Scheduling → Testing → Run All Tests
- **Benchmark Performance**: Medical Scheduling → Testing → Benchmark Performance
- **Test OAuth Scopes**: Medical Scheduling → Testing → Test OAuth Scopes

---

## Next Steps for Development

### Phase 2: Build Business Logic

Now that the data layer is complete, you can build:

1. **Schedule CRUD Operations**
   ```javascript
   function createSchedule(facultyId, date, startTime, endTime, location) {
     var sheetManager = SheetManager.getInstance();
     var authService = AuthService.getInstance();
     var user = authService.requireAdmin();

     var scheduleId = 'SCH' + Date.now();
     sheetManager.appendRow('Schedule', [
       scheduleId, facultyId, getFacultyName(facultyId),
       date, startTime, endTime, location,
       'Clinical Rounds', 'Confirmed', '',
       new Date(), user.email
     ]);

     return scheduleId;
   }
   ```

2. **Swap Request Workflow**
   ```javascript
   function createSwapRequest(originalScheduleId, requestedScheduleId, reason) {
     var authService = AuthService.getInstance();
     var user = authService.requireFaculty();

     // Implementation here...
   }
   ```

3. **Calendar Integration**
   ```javascript
   function syncToCalendar(scheduleId) {
     var calendar = CalendarApp.getDefaultCalendar();
     // Create calendar event...
   }
   ```

---

## Common Issues and Solutions

### "Unable to get user email"
**Solution**: Make sure you're logged into Google account

### "Sheet not found"
**Solution**: Run Initialize Spreadsheet from menu

### "Unauthorized: Admin role required"
**Solution**: Add your email to Faculty sheet with Admin role

### "Authorization required" keeps appearing
**Solution**: Re-authorize by running onOpen() function manually

---

## Useful Commands

### In Apps Script Editor

**Save**: Ctrl+S (Windows) / Cmd+S (Mac)
**Run Function**: Ctrl+R (Windows) / Cmd+R (Mac)
**View Logs**: Ctrl+Enter (Windows) / Cmd+Enter (Mac)

### Testing Functions

Run from Apps Script editor dropdown:
- `initializeSpreadsheet()` - Set up sheets
- `addSampleData()` - Add test data
- `testServices()` - Quick service check
- `runAllTests()` - Full test suite
- `resetSpreadsheet()` - Reset everything (⚠️ deletes data!)

---

## API Examples

### Get Current User
```javascript
var authService = AuthService.getInstance();
var user = authService.getCurrentUser();
Logger.log(user.name + ' (' + user.role + ')');
```

### Add Faculty Member
```javascript
var sheetManager = SheetManager.getInstance();
sheetManager.appendRow('Faculty', [
  'FAC005',
  'Dr. Jane Doe',
  'jane.doe@med.edu',
  'Pediatrics',
  'Neonatology',
  'Faculty',
  '555-0105',
  new Date()
]);
```

### Query Schedules
```javascript
var sheetManager = SheetManager.getInstance();
var schedules = sheetManager.queryByColumn('Schedule', 2, 'FAC001');
Logger.log('Found ' + schedules.length + ' schedules');
```

### Find User by Email
```javascript
var authService = AuthService.getInstance();
var user = authService.getUserByEmail('jane.doe@med.edu');
if (user) {
  Logger.log(user.name + ' is in ' + user.department);
}
```

---

## Documentation Reference

- **Overview**: `README.md`
- **Deployment**: `DEPLOYMENT.md`
- **API Reference**: `TECHNICAL_DOCS.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **Structure**: `PROJECT_STRUCTURE.md`

---

## Support

### Check Logs
1. Apps Script editor → **View** → **Logs**
2. Or: **Execution log** at bottom of editor

### Check Audit Log
1. Go to **AuditLog** sheet
2. Review recent errors and actions

### Run Diagnostics
1. **Medical Scheduling** → **Testing** → **Test Services**
2. Check all services are operational

---

## Development Tips

### Best Practices

1. **Always check user role before sensitive operations**
   ```javascript
   var user = authService.requireAdmin();
   ```

2. **Log all operations**
   ```javascript
   logger.info('Schedule created', { scheduleId: scheduleId });
   ```

3. **Use try-catch for error handling**
   ```javascript
   try {
     // Operation
   } catch (e) {
     logger.error('Operation failed', { error: e.toString() });
     throw e;
   }
   ```

4. **Test changes immediately**
   - Use `runAllTests()` after making changes
   - Add new tests for new features

### Debugging

**View Variables**:
```javascript
Logger.log(JSON.stringify(myObject, null, 2));
```

**Check Sheet Contents**:
```javascript
var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Faculty');
var data = sheet.getDataRange().getValues();
Logger.log(data);
```

**Monitor Performance**:
```javascript
var startTime = Date.now();
// ... operation ...
Logger.log('Took ' + (Date.now() - startTime) + 'ms');
```

---

## Ready to Build! 🚀

You now have a complete, production-ready data layer for the Medical Scheduling System. All core services (SheetManager, AuthService, Logger) are operational and tested.

Start building your business logic with confidence! 💪

---

**Questions?** Check the documentation files or run the test suite to verify everything is working correctly.
