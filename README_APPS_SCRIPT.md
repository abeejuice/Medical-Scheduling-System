# Medical Scheduling System - Apps Script Backend

## Overview

This is a Google Apps Script-based backend for a medical college department scheduling system. It provides a persistent data layer, authentication, and logging capabilities built on Google Sheets.

## Architecture

### Core Components

1. **SheetManager.gs** - Singleton for data operations
   - Append, update, and query rows across all sheets
   - Type-safe operations with error handling
   - Caching for performance optimization

2. **AuthService.gs** - Authentication and authorization
   - Identifies current user from Faculty sheet
   - Role-based access control (Admin, Faculty, Guest)
   - Permission checking and enforcement

3. **Logger.gs** - Centralized logging utility
   - Timestamp and severity-based logging
   - Automatic error logging to AuditLog sheet
   - Console and sheet dual logging

4. **Setup.gs** - Initialization and testing utilities
   - One-time workbook setup
   - Sample data generation
   - Built-in tests for core components

## Data Model

### Sheet Structure

#### Faculty Sheet
| Email | Name | Role | Department | ContactNumber | Status |
|-------|------|------|------------|---------------|--------|
| user@example.com | Dr. Name | Admin/Faculty | Cardiology | 555-0001 | Active |

#### Schedule Sheet
| EventID | FacultyEmail | EventType | StartDateTime | EndDateTime | Location | Description | Status | CalendarEventID |
|---------|-------------|-----------|---------------|-------------|----------|-------------|--------|-----------------|

#### SwapRequests Sheet
| RequestID | RequesterEmail | TargetEmail | EventID | RequestDate | Status | ApproverEmail | ApprovalDate | Comments |
|-----------|----------------|-------------|---------|-------------|--------|---------------|--------------|----------|

#### AuditLog Sheet
| Timestamp | Severity | Message | Metadata | UserEmail |
|-----------|----------|---------|----------|-----------|

## Installation

### 1. Create Google Spreadsheet
1. Go to Google Drive and create a new Google Spreadsheet
2. Name it "Medical Scheduling System"

### 2. Open Apps Script Editor
1. In the spreadsheet, go to **Extensions** → **Apps Script**
2. Delete the default `Code.gs` file

### 3. Add Script Files
Copy the following files to the Apps Script editor:
- `appsscript.json` (Settings/Project Settings → Show "appsscript.json" manifest)
- `Logger.gs`
- `SheetManager.gs`
- `AuthService.gs`
- `Setup.gs`

### 4. Initialize the Workbook
1. Save all files (Ctrl+S / Cmd+S)
2. Refresh the spreadsheet
3. A new menu "Medical Scheduling" will appear
4. Click **Medical Scheduling** → **Initialize Workbook**
5. Authorize the script when prompted
6. The workbook will be set up with all required sheets

### 5. (Optional) Add Sample Data
1. Click **Medical Scheduling** → **Add Sample Data**
2. This will add test faculty members for development

## Usage Examples

### Using SheetManager

```javascript
// Get singleton instance
var sheetManager = SheetManager.getInstance();

// Append a new row
var rowData = ['email@example.com', 'Dr. Name', 'Faculty', 'Department', '555-0000', 'Active'];
var rowNumber = sheetManager.appendRow('Faculty', rowData);

// Query rows with filter
var activeFaculty = sheetManager.queryRows('Faculty', function(row) {
  return row.Status === 'Active';
});

// Find a specific row
var user = sheetManager.findRow('Faculty', { Email: 'email@example.com' });

// Update a row by criteria
sheetManager.updateRowByCriteria('Faculty',
  { Email: 'email@example.com' },
  { Status: 'Inactive' }
);
```

### Using AuthService

```javascript
// Get singleton instance
var authService = AuthService.getInstance();

// Get current user
var user = authService.getCurrentUser();
console.log(user.Name, user.Role);

// Check user role
if (authService.isAdmin()) {
  // Admin-only functionality
}

// Require specific role (throws error if not authorized)
authService.requireAdmin();

// Get all faculty
var allFaculty = authService.getAllFaculty();
```

### Using Logger

```javascript
// Log at different severity levels
Logger.debug('Debug message');
Logger.info('Info message');
Logger.warning('Warning message');
Logger.error('Error message', { additionalData: 'value' });
Logger.critical('Critical error', { stackTrace: 'trace' });

// Errors and critical messages are automatically logged to AuditLog sheet
```

## OAuth Scopes

The project requires the following OAuth scopes (defined in `appsscript.json`):

- `https://www.googleapis.com/auth/spreadsheets` - Read/write spreadsheet data
- `https://www.googleapis.com/auth/calendar` - Manage calendar events
- `https://www.googleapis.com/auth/gmail.send` - Send email notifications
- `https://www.googleapis.com/auth/script.external_request` - Make external API calls
- `https://www.googleapis.com/auth/userinfo.email` - Get user email for authentication

## Testing

Built-in test functions are available in the custom menu:

1. **Test SheetManager** - Validates append, query, update, and find operations
2. **Test AuthService** - Validates user identification and role checking

Run these tests after initialization to verify everything is working correctly.

## Error Handling

All functions implement comprehensive error handling:
- Errors are logged with timestamp and severity
- ERROR and CRITICAL logs are written to AuditLog sheet
- Detailed error metadata is captured for debugging
- User-friendly error messages are shown in UI

## Best Practices

1. **Always use singleton instances**
   ```javascript
   var sheetManager = SheetManager.getInstance();
   var authService = AuthService.getInstance();
   ```

2. **Log important operations**
   ```javascript
   Logger.info('Operation started', { userId: user.Email });
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
     // Your code
   } catch (e) {
     Logger.error('Operation failed', { error: e.toString() });
     throw e;
   }
   ```

4. **Check authorization before sensitive operations**
   ```javascript
   authService.requireAdmin();
   // Admin-only code here
   ```

## Security Considerations

- User roles are validated from the Faculty sheet
- All sensitive operations should check authorization
- Audit logs track all error and critical events
- OAuth scopes follow principle of least privilege

## Next Steps

With this foundation in place, you can now:
- Implement schedule management functions
- Add calendar integration
- Create swap request workflows
- Build email notification system
- Develop web UI using HTML Service

## Support

For issues or questions:
1. Check the AuditLog sheet for error details
2. Run built-in test functions from the menu
3. Review the Logger output in Apps Script console

## Version

- **Version**: 1.0.0
- **Last Updated**: 2026-02-12
- **Apps Script Runtime**: V8
