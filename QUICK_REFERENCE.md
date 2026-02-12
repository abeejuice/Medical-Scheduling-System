# Quick Reference Guide

## Common Operations

### Initialize System (One-Time Setup)
```javascript
// Run from custom menu: Medical Scheduling → Initialize Workbook
initializeWorkbook();
```

### Add Faculty Member
```javascript
var sheetManager = SheetManager.getInstance();
sheetManager.appendRow('Faculty', [
  'email@medical.edu',
  'Dr. Name',
  'Faculty',        // or 'Admin'
  'Department',
  '555-0000',
  'Active'
]);
```

### Get Current User
```javascript
var authService = AuthService.getInstance();
var user = authService.getCurrentUser();
Logger.info('Current user: ' + user.Name + ' (' + user.Role + ')');
```

### Check Authorization
```javascript
var authService = AuthService.getInstance();

// Check role
if (authService.isAdmin()) {
  // Admin-only code
}

// Require role (throws error if not authorized)
authService.requireAdmin();
```

### Query Data
```javascript
var sheetManager = SheetManager.getInstance();

// Get all active faculty
var faculty = sheetManager.queryRows('Faculty', function(row) {
  return row.Status === 'Active';
});

// Find specific user
var user = sheetManager.findRow('Faculty', {
  Email: 'user@medical.edu'
});
```

### Update Data
```javascript
var sheetManager = SheetManager.getInstance();

// Update by criteria
sheetManager.updateRowByCriteria('Faculty',
  { Email: 'user@medical.edu' },
  { Department: 'New Department', ContactNumber: '555-1111' }
);
```

### Add Schedule Entry
```javascript
var sheetManager = SheetManager.getInstance();
sheetManager.appendRow('Schedule', [
  'EVT-001',                    // EventID
  'faculty@medical.edu',        // FacultyEmail
  'Lecture',                    // EventType
  new Date('2026-02-15 09:00'), // StartDateTime
  new Date('2026-02-15 11:00'), // EndDateTime
  'Room 301',                   // Location
  'Introduction to Cardiology', // Description
  'Scheduled',                  // Status
  ''                            // CalendarEventID (empty initially)
]);
```

### Logging
```javascript
// Different severity levels
Logger.debug('Debug message', { detail: 'value' });
Logger.info('Info message');
Logger.warning('Warning message');
Logger.error('Error occurred', { error: e.toString() });
Logger.critical('Critical issue', { stackTrace: trace });

// ERROR and CRITICAL are automatically saved to AuditLog sheet
```

## Sheet Structures

### Faculty Sheet
```
Email | Name | Role | Department | ContactNumber | Status
```

### Schedule Sheet
```
EventID | FacultyEmail | EventType | StartDateTime | EndDateTime | Location | Description | Status | CalendarEventID
```

### SwapRequests Sheet
```
RequestID | RequesterEmail | TargetEmail | EventID | RequestDate | Status | ApproverEmail | ApprovalDate | Comments
```

### AuditLog Sheet
```
Timestamp | Severity | Message | Metadata | UserEmail
```

## Role Definitions

- **Admin**: Full system access, can manage all faculty and schedules
- **Faculty**: Can manage own schedule, submit swap requests
- **Guest**: Read-only access (default for users not in Faculty sheet)

## Common Patterns

### Safe Operation with Error Handling
```javascript
function myFunction() {
  try {
    var authService = AuthService.getInstance();
    authService.requireFaculty();

    var sheetManager = SheetManager.getInstance();
    // Your code here

    Logger.info('Operation completed successfully');
    return { success: true };

  } catch (e) {
    Logger.error('Operation failed', {
      error: e.toString(),
      function: 'myFunction'
    });
    throw e;
  }
}
```

### Query with Multiple Conditions
```javascript
var results = sheetManager.queryRows('Schedule', function(row) {
  return row.FacultyEmail === 'user@medical.edu' &&
         row.Status === 'Scheduled' &&
         new Date(row.StartDateTime) > new Date();
});
```

### Get All Faculty by Department
```javascript
var cardiologyFaculty = sheetManager.queryRows('Faculty', function(row) {
  return row.Department === 'Cardiology' && row.Status === 'Active';
});
```

## Testing

### Test SheetManager
```javascript
// From menu: Medical Scheduling → Test SheetManager
testSheetManager();
```

### Test AuthService
```javascript
// From menu: Medical Scheduling → Test AuthService
testAuthService();
```

## OAuth Scopes

The system requests these permissions:
- `spreadsheets` - Read/write sheet data
- `calendar` - Manage calendar events
- `gmail.send` - Send email notifications
- `script.external_request` - Make external API calls
- `userinfo.email` - Identify current user

## Troubleshooting

### User Not Found
Add the user to Faculty sheet with email matching Google account

### Permission Denied
Run authorization from Apps Script editor: Run → initializeWorkbook

### Sheet Not Found
Run initializeWorkbook() from custom menu

### Logs Not Appearing
Check Apps Script editor → Executions panel

## Best Practices

1. Always use singleton instances
2. Log important operations
3. Handle errors with try-catch
4. Check authorization before sensitive operations
5. Use metadata parameter in Logger for context
6. Test changes with built-in test functions

## File Upload (for future bulk import)

```javascript
function uploadFacultyCSV(csvData) {
  try {
    var sheetManager = SheetManager.getInstance();
    var lines = csvData.split('\n');

    for (var i = 1; i < lines.length; i++) { // Skip header
      var fields = lines[i].split(',');
      if (fields.length >= 6) {
        sheetManager.appendRow('Faculty', fields);
      }
    }

    Logger.info('CSV upload completed', { rows: lines.length - 1 });
  } catch (e) {
    Logger.error('CSV upload failed', { error: e.toString() });
    throw e;
  }
}
```

## Custom Menu Structure

```
Medical Scheduling
├── Initialize Workbook
├── Add Sample Data
├── ─────────────────
├── Test SheetManager
└── Test AuthService
```

Access via: Spreadsheet menu bar → Medical Scheduling

## Status Values

### Faculty.Status
- `Active` - Currently active faculty member
- `Inactive` - Inactive/removed faculty

### Schedule.Status
- `Scheduled` - Confirmed event
- `Pending` - Awaiting confirmation
- `Cancelled` - Cancelled event
- `Completed` - Past event

### SwapRequests.Status
- `Pending` - Awaiting approval
- `Approved` - Approved by admin
- `Rejected` - Rejected by admin
- `Completed` - Swap executed

## Next Development Steps

1. Implement schedule management functions
2. Add Google Calendar integration
3. Create swap request workflow
4. Build email notification system
5. Develop web UI using HTML Service

---

**Quick Help**: See [README_APPS_SCRIPT.md](README_APPS_SCRIPT.md) for detailed API documentation
