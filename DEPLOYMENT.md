# Medical Scheduling System - Deployment Guide

## Overview
This guide will help you deploy the Medical Scheduling System to Google Apps Script bound to a Google Sheets workbook.

## Prerequisites
- Google Account
- Access to Google Sheets and Google Apps Script

## Deployment Steps

### Step 1: Create a New Google Sheets Workbook
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Medical Scheduling System"

### Step 2: Open Apps Script Editor
1. In your Google Sheet, click **Extensions** > **Apps Script**
2. This will open the Apps Script editor in a new tab

### Step 3: Add Script Files
You need to add all the following files to your Apps Script project:

1. **appsscript.json** (Configuration)
   - Click the gear icon (⚙️) on the left sidebar
   - Check "Show appsscript.json manifest file in editor"
   - Go back to the editor
   - Click on `appsscript.json` in the file list
   - Replace the contents with the contents of `appsscript.json` from this project

2. **Code.gs** (Main entry point)
   - Rename the default `Code.gs` file if needed
   - Copy the contents from `Code.gs`

3. **Logger.gs** (Logging utility)
   - Click the **+** button next to Files
   - Select "Script"
   - Name it `Logger`
   - Copy the contents from `Logger.gs`

4. **SheetManager.gs** (Data layer)
   - Add a new script file named `SheetManager`
   - Copy the contents from `SheetManager.gs`

5. **AuthService.gs** (Authentication)
   - Add a new script file named `AuthService`
   - Copy the contents from `AuthService.gs`

6. **Initialize.gs** (Setup utilities)
   - Add a new script file named `Initialize`
   - Copy the contents from `Initialize.gs`

### Step 4: Save and Deploy
1. Click the **Save** icon (💾) or press `Ctrl+S` (Windows) / `Cmd+S` (Mac)
2. Give your project a name: "Medical Scheduling System"
3. Click **Save**

### Step 5: Authorize the Script
1. Click **Run** > **Run function** > **onOpen**
2. You'll be prompted to authorize the script
3. Click **Review Permissions**
4. Choose your Google account
5. Click **Advanced** > **Go to Medical Scheduling System (unsafe)**
6. Click **Allow**

### Step 6: Initialize the Spreadsheet
1. Go back to your Google Sheet
2. Refresh the page
3. You should see a new menu: **Medical Scheduling**
4. Click **Medical Scheduling** > **Setup** > **Initialize Spreadsheet**
5. Wait for the initialization to complete
6. Click **OK** when you see the success message

### Step 7: Add Sample Data (Optional)
1. Click **Medical Scheduling** > **Setup** > **Add Sample Data**
2. This will add test faculty and schedule entries
3. Click **OK** when complete

### Step 8: Test the System
1. Click **Medical Scheduling** > **Setup** > **Test Services** (if you added this function)
2. Verify all services are working
3. Check that all four sheets exist:
   - Faculty
   - Schedule
   - SwapRequests
   - AuditLog

## Verification Checklist

After deployment, verify the following:

- [ ] Google Sheets workbook exists with correct name
- [ ] Four sheets exist with proper headers:
  - [ ] Faculty (FacultyID, Name, Email, Department, Specialty, Role, Phone, CreatedDate)
  - [ ] Schedule (ScheduleID, FacultyID, FacultyName, Date, StartTime, EndTime, Location, Type, Status, Notes, CreatedDate, CreatedBy)
  - [ ] SwapRequests (RequestID, RequestorFacultyID, RequestorName, TargetFacultyID, TargetName, OriginalScheduleID, RequestedScheduleID, Status, Reason, RequestDate, ResponseDate, ResponseNotes)
  - [ ] AuditLog (Timestamp, User, Action, Details, Metadata)
- [ ] Apps Script project is bound to the workbook
- [ ] OAuth scopes are declared in appsscript.json
- [ ] Custom menu "Medical Scheduling" appears in the spreadsheet
- [ ] SheetManager can append, update, and query rows
- [ ] AuthService identifies current user and role
- [ ] Logger records errors with timestamp and severity

## OAuth Scopes Explained

The application requires the following permissions:

- **spreadsheets**: Read and write access to Google Sheets data
- **calendar**: Access to create and manage calendar events
- **gmail.send**: Send email notifications
- **script.container.ui**: Display custom menus and dialogs
- **userinfo.email**: Identify the current user

## Troubleshooting

### Script Authorization Issues
- Make sure you've authorized the script with all required permissions
- Try running `onOpen()` function manually from the Apps Script editor
- Clear browser cache and try again

### Sheets Not Created
- Check that you've run `initializeSpreadsheet()` function
- Look for error messages in the Apps Script logs (View > Logs)
- Verify you have edit permissions on the spreadsheet

### User Not Found Errors
- Add your email to the Faculty sheet
- Make sure the Email column matches your Google account email exactly
- Assign yourself a role (Admin or Faculty)

### Permission Denied Errors
- Verify the OAuth scopes in appsscript.json
- Re-authorize the script
- Check that your user role in Faculty sheet is correct

## Next Steps

After successful deployment:

1. Add real faculty members to the Faculty sheet
2. Create schedule entries
3. Test the swap request workflow (to be implemented)
4. Set up email notifications (to be implemented)
5. Configure calendar integration (to be implemented)

## Support

For issues or questions, check the logs:
1. In Apps Script editor, click **View** > **Logs**
2. Check the AuditLog sheet for error entries

## Security Considerations

- Only authorized users should have edit access to the spreadsheet
- Regularly review the AuditLog sheet for suspicious activity
- Keep the Faculty sheet up to date with current users
- Use role-based access control appropriately
