# Medical Scheduling System - Deployment Guide

## Quick Start Checklist

### Prerequisites
- [ ] Google Account with access to Google Drive
- [ ] Permission to create Google Sheets and Apps Script projects

### Deployment Steps

#### Step 1: Create Google Spreadsheet (2 minutes)
1. Go to [Google Drive](https://drive.google.com)
2. Click **New** → **Google Sheets** → **Blank spreadsheet**
3. Name it: `Medical Scheduling System`
4. Note the spreadsheet URL for reference

#### Step 2: Set Up Apps Script Project (5 minutes)
1. In the spreadsheet, click **Extensions** → **Apps Script**
2. You'll see a default `Code.gs` file - delete it
3. Click the settings icon (⚙️) on the left sidebar
4. Check "Show 'appsscript.json' manifest file in editor"
5. Go back to the Editor view

#### Step 3: Copy Script Files (5 minutes)
Copy each file from this repository to the Apps Script editor:

1. **appsscript.json** (in the manifest file)
   - Click on `appsscript.json` in the file list
   - Replace content with the `appsscript.json` from this repo

2. **Logger.gs**
   - Click the **+** next to Files
   - Name it `Logger`
   - Paste content from `Logger.gs`

3. **SheetManager.gs**
   - Click the **+** next to Files
   - Name it `SheetManager`
   - Paste content from `SheetManager.gs`

4. **AuthService.gs**
   - Click the **+** next to Files
   - Name it `AuthService`
   - Paste content from `AuthService.gs`

5. **Setup.gs**
   - Click the **+** next to Files
   - Name it `Setup`
   - Paste content from `Setup.gs`

#### Step 4: Save and Deploy (3 minutes)
1. Click the **Save** icon (💾) or press `Ctrl+S` / `Cmd+S`
2. The project will compile and save
3. Close the Apps Script tab
4. Return to your Google Spreadsheet

#### Step 5: Initialize Workbook (2 minutes)
1. Refresh the spreadsheet page (`F5` or `Cmd+R`)
2. You should see a new menu item: **Medical Scheduling**
3. Click **Medical Scheduling** → **Initialize Workbook**
4. **First-time authorization required:**
   - Click "Continue" when prompted
   - Select your Google account
   - Click "Advanced" → "Go to Medical Scheduling System (unsafe)"
   - Click "Allow" to grant permissions
5. Wait for the initialization to complete
6. You'll see a success message with details of created sheets

#### Step 6: Verify Installation (2 minutes)
1. Check that the following sheets exist:
   - ✅ Faculty
   - ✅ Schedule
   - ✅ SwapRequests
   - ✅ AuditLog

2. Verify each sheet has the correct headers:
   - **Faculty**: Email, Name, Role, Department, ContactNumber, Status
   - **Schedule**: EventID, FacultyEmail, EventType, StartDateTime, EndDateTime, Location, Description, Status, CalendarEventID
   - **SwapRequests**: RequestID, RequesterEmail, TargetEmail, EventID, RequestDate, Status, ApproverEmail, ApprovalDate, Comments
   - **AuditLog**: Timestamp, Severity, Message, Metadata, UserEmail

3. Test the components:
   - Click **Medical Scheduling** → **Test SheetManager**
   - Click **Medical Scheduling** → **Test AuthService**
   - Both should show success messages

#### Step 7: Add Initial Data (Optional, 2 minutes)
1. **Option A: Add sample data**
   - Click **Medical Scheduling** → **Add Sample Data**
   - This adds 4 test faculty members

2. **Option B: Add real data manually**
   - Go to the **Faculty** sheet
   - Add your admin user in row 2:
     ```
     your-email@domain.com | Your Name | Admin | Department | 555-0000 | Active
     ```
   - Add additional faculty members as needed

## Acceptance Criteria Verification

### ✅ Criterion 1: Google Sheets workbook exists with correct tabs and headers
**Status**: COMPLETE
- Faculty sheet with headers: Email, Name, Role, Department, ContactNumber, Status
- Schedule sheet with headers: EventID, FacultyEmail, EventType, StartDateTime, EndDateTime, Location, Description, Status, CalendarEventID
- SwapRequests sheet with headers: RequestID, RequesterEmail, TargetEmail, EventID, RequestDate, Status, ApproverEmail, ApprovalDate, Comments
- AuditLog sheet with headers: Timestamp, Severity, Message, Metadata, UserEmail
- Created automatically by `initializeWorkbook()` function

### ✅ Criterion 2: Apps Script project bound to workbook with OAuth scopes
**Status**: COMPLETE
- Project is container-bound to the spreadsheet
- `appsscript.json` declares all required scopes:
  - `spreadsheets` - for data operations
  - `calendar` - for calendar integration
  - `gmail.send` - for email notifications
  - `script.external_request` - for external APIs
  - `userinfo.email` - for authentication

### ✅ Criterion 3: SheetManager singleton with append, update, query operations
**Status**: COMPLETE
- `SheetManager.getInstance()` provides singleton access
- Methods implemented:
  - `appendRow(sheetName, rowData)` - adds new rows
  - `updateRow(sheetName, rowNumber, rowData)` - updates existing rows
  - `queryRows(sheetName, filterFn)` - queries with optional filter
  - `findRow(sheetName, criteria)` - finds single row by criteria
  - `updateRowByCriteria(sheetName, criteria, updates)` - updates by criteria
- All operations include error handling and logging
- Test function available: `testSheetManager()`

### ✅ Criterion 4: AuthService identifies user and role from Faculty sheet
**Status**: COMPLETE
- `AuthService.getInstance()` provides singleton access
- Methods implemented:
  - `getCurrentUser()` - gets user from Faculty sheet
  - `getCurrentUserRole()` - returns Admin/Faculty/Guest
  - `isAdmin()`, `isFaculty()` - role checking
  - `requireAdmin()`, `requireFaculty()` - authorization enforcement
  - `getFacultyByEmail(email)` - lookup by email
- User identification based on Session.getActiveUser().getEmail()
- Role assignment from Faculty sheet data
- Test function available: `testAuthService()`

### ✅ Criterion 5: All functions log errors with timestamp and severity
**Status**: COMPLETE
- Logger utility provides structured logging
- Severity levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- All log entries include:
  - ISO 8601 timestamp
  - Severity level
  - Message
  - Optional metadata object
- ERROR and CRITICAL logs written to AuditLog sheet
- All SheetManager and AuthService functions use Logger for errors
- Example: `Logger.error('Operation failed', { error: e.toString() })`

## Post-Deployment Verification

Run these checks to ensure everything is working:

### 1. Check Sheet Structure
```
✓ All 4 sheets exist
✓ Headers are bold, blue background, white text
✓ Header row is frozen
✓ Columns are auto-sized
```

### 2. Test SheetManager
```
Medical Scheduling → Test SheetManager
Expected results:
✓ Append test passed
✓ Query test passed
✓ Update test passed
✓ Find test passed
```

### 3. Test AuthService
```
Medical Scheduling → Test AuthService
Expected results:
✓ Current user email displayed
✓ User role identified (or "not found" if not in Faculty sheet)
✓ Role checks function correctly
```

### 4. Check Logging
```
✓ Open Apps Script editor
✓ Click "Executions" in left sidebar
✓ Verify recent executions logged
✓ Check AuditLog sheet for ERROR/CRITICAL entries (if any)
```

## Troubleshooting

### Issue: "Authorization required" keeps appearing
**Solution**:
1. Go to Apps Script editor
2. Click "Run" → Select `initializeWorkbook`
3. Complete authorization flow
4. Return to spreadsheet and try again

### Issue: Custom menu doesn't appear
**Solution**:
1. Refresh the spreadsheet page
2. Wait 5-10 seconds for scripts to load
3. If still not visible, check Apps Script editor for syntax errors

### Issue: Test functions fail
**Solution**:
1. Ensure `initializeWorkbook()` has been run successfully
2. Check that all sheets exist with correct headers
3. Review error messages in the alert dialog
4. Check AuditLog sheet for detailed error information

### Issue: AuthService can't find user
**Solution**:
1. Add your email to Faculty sheet manually
2. Ensure email exactly matches your Google account email
3. Set Role to "Admin" or "Faculty"
4. Set Status to "Active"
5. Run `testAuthService()` again

## Security Notes

1. **OAuth Scopes**: Users will see permissions requested on first run
2. **Data Access**: Only users with spreadsheet access can use the system
3. **Role-Based Access**: Use `requireAdmin()` for sensitive operations
4. **Audit Trail**: All errors are logged with user email to AuditLog

## Next Steps

With the persistent data layer established, you can now:

1. **Implement Business Logic**
   - Schedule management functions
   - Swap request workflows
   - Notification systems

2. **Add Calendar Integration**
   - Create calendar events from Schedule sheet
   - Sync schedule changes to Calendar
   - Handle event updates and deletions

3. **Build User Interface**
   - HTML Service for web UI
   - Custom dialogs and sidebars
   - Data validation forms

4. **Set Up Notifications**
   - Email alerts for swap requests
   - Schedule change notifications
   - Reminder emails

## Support Resources

- **Apps Script Documentation**: https://developers.google.com/apps-script
- **Sheets API Reference**: https://developers.google.com/sheets/api
- **Calendar API Reference**: https://developers.google.com/calendar
- **Gmail API Reference**: https://developers.google.com/gmail/api

## File Manifest

- `appsscript.json` - Project manifest and OAuth scopes
- `Logger.gs` - Logging utility with severity levels
- `SheetManager.gs` - Data layer singleton
- `AuthService.gs` - Authentication and authorization
- `Setup.gs` - Initialization and test functions
- `README_APPS_SCRIPT.md` - Technical documentation
- `DEPLOYMENT_GUIDE.md` - This file

Total deployment time: **~20 minutes**
