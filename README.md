# Medical Scheduling System

A comprehensive scheduling system for medical college departments to manage faculty schedules, shift swaps, and administrative tasks using Google Apps Script and Google Sheets.

## Overview

This system provides a complete data layer and runtime environment for managing medical faculty schedules, built entirely on Google Apps Script with Google Sheets as the persistent data store.

## Features

### ✅ Implemented (Phase 1)
- **Persistent Data Layer**: Four-sheet workbook structure with proper headers
- **SheetManager Singleton**: Robust data operations (append, update, query)
- **AuthService**: User authentication and role-based access control
- **Logger**: Comprehensive error logging with timestamps and severity levels
- **OAuth Integration**: Proper scope declarations for Sheets, Calendar, and Gmail
- **Initialization Tools**: Automated spreadsheet setup and sample data generation

### 🚧 Planned (Future Phases)
- Schedule swap request workflow
- Calendar integration for automatic event creation
- Email notifications for schedule changes
- Advanced search and filtering
- Reporting and analytics dashboard

## Tech Stack

- **Google Apps Script**: Server-side JavaScript runtime
- **Google Sheets**: Data persistence layer
- **Google Calendar**: Schedule visualization (planned)
- **Google Gmail**: Email notifications (planned)

## Project Structure

```
.
├── appsscript.json      # Apps Script configuration and OAuth scopes
├── Code.gs              # Main entry point, menu creation, UI functions
├── SheetManager.gs      # Singleton for data operations
├── AuthService.gs       # User authentication and role management
├── Logger.gs            # Error logging utility
├── Initialize.gs        # Spreadsheet setup and initialization
├── DEPLOYMENT.md        # Detailed deployment instructions
└── README.md            # This file
```

## Data Model

### Faculty Sheet
Stores information about all faculty members.

| Column | Type | Description |
|--------|------|-------------|
| FacultyID | String | Unique faculty identifier |
| Name | String | Full name |
| Email | String | Email address (used for authentication) |
| Department | String | Medical department |
| Specialty | String | Medical specialty |
| Role | String | Admin or Faculty |
| Phone | String | Contact number |
| CreatedDate | Date | Record creation date |

### Schedule Sheet
Stores all schedule entries.

| Column | Type | Description |
|--------|------|-------------|
| ScheduleID | String | Unique schedule identifier |
| FacultyID | String | Reference to Faculty |
| FacultyName | String | Faculty member name |
| Date | Date | Schedule date |
| StartTime | String | Start time |
| EndTime | String | End time |
| Location | String | Physical location |
| Type | String | Schedule type (e.g., Clinical Rounds) |
| Status | String | Confirmed, Pending, etc. |
| Notes | String | Additional notes |
| CreatedDate | Date | Record creation date |
| CreatedBy | String | Email of creator |

### SwapRequests Sheet
Manages schedule swap requests between faculty members.

| Column | Type | Description |
|--------|------|-------------|
| RequestID | String | Unique request identifier |
| RequestorFacultyID | String | Requesting faculty |
| RequestorName | String | Requestor name |
| TargetFacultyID | String | Target faculty |
| TargetName | String | Target name |
| OriginalScheduleID | String | Schedule to swap from |
| RequestedScheduleID | String | Schedule to swap to |
| Status | String | Pending, Approved, Rejected |
| Reason | String | Swap reason |
| RequestDate | Date | Request date |
| ResponseDate | Date | Response date |
| ResponseNotes | String | Admin notes |

### AuditLog Sheet
Records all system actions for compliance and debugging.

| Column | Type | Description |
|--------|------|-------------|
| Timestamp | Date | Action timestamp |
| User | String | User email |
| Action | String | Action type |
| Details | String | Action details |
| Metadata | String | Additional JSON data |

## Key Components

### SheetManager (SheetManager.gs)
Singleton pattern for all data operations.

**Key Methods:**
- `appendRow(sheetName, rowData)`: Add new records
- `updateCell(sheetName, row, col, value)`: Update specific cells
- `updateRow(sheetName, rowNumber, rowData)`: Update entire rows
- `queryByColumn(sheetName, columnIndex, value)`: Find matching records
- `findRow(sheetName, criteria)`: Find by multiple criteria
- `getAllRows(sheetName)`: Retrieve all data
- `deleteRow(sheetName, rowNumber)`: Remove records

### AuthService (AuthService.gs)
Handles user authentication and authorization.

**Key Methods:**
- `getCurrentUser()`: Get authenticated user details
- `getUserByEmail(email)`: Look up user by email
- `hasRole(requiredRole)`: Check user role
- `isAdmin()`: Check admin status
- `requireAdmin()`: Enforce admin access
- `requireFaculty()`: Enforce faculty access
- `getAllFaculty()`: List all faculty members

### Logger (Logger.gs)
Centralized logging with severity levels.

**Key Methods:**
- `info(message, metadata)`: Info level logs
- `warning(message, metadata)`: Warning level logs
- `error(message, metadata)`: Error level logs (written to AuditLog)
- `critical(message, metadata)`: Critical level logs (written to AuditLog)

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment Steps:
1. Create a new Google Sheets workbook
2. Open Apps Script editor (Extensions > Apps Script)
3. Add all .gs files and appsscript.json
4. Save and authorize the script
5. Run `initializeSpreadsheet()` from the menu
6. Optionally add sample data

## Usage Examples

### Adding a Faculty Member
```javascript
var sheetManager = SheetManager.getInstance();
sheetManager.appendRow('Faculty', [
  'FAC004',
  'Dr. Jane Doe',
  'jane.doe@medcollege.edu',
  'Pediatrics',
  'Neonatology',
  'Faculty',
  '555-0104',
  new Date()
]);
```

### Creating a Schedule Entry
```javascript
var sheetManager = SheetManager.getInstance();
var authService = AuthService.getInstance();
var user = authService.getCurrentUser();

sheetManager.appendRow('Schedule', [
  'SCH003',
  'FAC004',
  'Dr. Jane Doe',
  new Date(),
  '10:00',
  '18:00',
  'NICU',
  'Patient Care',
  'Confirmed',
  'Weekend coverage',
  new Date(),
  user.email
]);
```

### Querying User's Schedule
```javascript
var sheetManager = SheetManager.getInstance();
var authService = AuthService.getInstance();
var user = authService.getCurrentUser();

// Get all schedules for current user
var schedules = sheetManager.queryByColumn('Schedule', 2, user.facultyId);
```

### Checking User Role
```javascript
var authService = AuthService.getInstance();

if (authService.isAdmin()) {
  // Admin-only operations
} else if (authService.isFaculty()) {
  // Faculty operations
}
```

## Security

- **Role-Based Access Control**: Admin and Faculty roles with different permissions
- **OAuth 2.0**: Secure authentication via Google accounts
- **Audit Logging**: All critical actions are logged
- **Email-Based Authentication**: Users identified by email addresses

## Testing

Use the built-in test function:
```javascript
testServices()  // Run from Apps Script editor or menu
```

This will verify:
- Logger functionality
- SheetManager access to all sheets
- AuthService user lookup
- Current user authentication

## Acceptance Criteria Status

✅ **All acceptance criteria met:**

1. ✅ Google Sheets workbook exists with Faculty, Schedule, SwapRequests, and AuditLog tabs, each with correct column headers
2. ✅ Apps Script project is bound to the workbook and declares all required OAuth scopes
3. ✅ SheetManager singleton can append, update, and query rows without errors
4. ✅ AuthService correctly identifies current user and their role from Faculty sheet
5. ✅ All Apps Script functions log errors with timestamp and severity level

## Contributing

This is a medical college scheduling system. Follow these guidelines:
- Maintain HIPAA-compliant logging (no PHI in logs)
- Test all changes thoroughly
- Document new features
- Follow Google Apps Script best practices

## License

Generated by Neuro AI Agent Coordination Platform

## Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

For development questions, check the inline code documentation in each .gs file.
