# Technical Documentation - Medical Scheduling System

## Architecture Overview

The Medical Scheduling System is built on Google Apps Script with a clean separation of concerns:

```
┌─────────────────────────────────────────────────┐
│              Google Sheets UI                    │
│         (Medical Scheduling Menu)                │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│               Code.gs (Entry Point)              │
│  - Menu creation (onOpen)                        │
│  - UI interaction handlers                       │
│  - Public API functions                          │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ AuthService  │ │SheetManager  │ │   Logger     │
│  (Singleton) │ │  (Singleton) │ │  (Singleton) │
│              │ │              │ │              │
│ - Get user   │ │ - CRUD ops   │ │ - Logging    │
│ - Check role │ │ - Queries    │ │ - Audit      │
└──────────────┘ └──────────────┘ └──────────────┘
        │                 │              │
        └────────┬────────┴──────────────┘
                 ▼
┌─────────────────────────────────────────────────┐
│         Google Sheets Data Layer                 │
│  - Faculty        - SwapRequests                 │
│  - Schedule       - AuditLog                     │
└─────────────────────────────────────────────────┘
```

## Core Components

### 1. Singleton Pattern Implementation

All core services use the Singleton pattern to ensure single instances and consistent state:

```javascript
var ServiceName = (function() {
  var instance;

  function createInstance() {
    return {
      // Service methods
    };
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();
```

**Benefits:**
- Single point of access
- Lazy initialization
- Memory efficiency
- Consistent state across calls

### 2. SheetManager API

#### Data Operations

**Append Operation:**
```javascript
var sheetManager = SheetManager.getInstance();
var rowNumber = sheetManager.appendRow('Faculty', [
  'FAC001', 'Dr. Smith', 'smith@example.com', ...
]);
```

**Query Operations:**
```javascript
// Query by single column
var results = sheetManager.queryByColumn('Faculty', 3, 'smith@example.com');

// Query by multiple criteria
var result = sheetManager.findRow('Faculty', {
  Email: 'smith@example.com',
  Role: 'Admin'
});

// Get all rows
var allFaculty = sheetManager.getAllRows('Faculty');
```

**Update Operations:**
```javascript
// Update single cell
sheetManager.updateCell('Faculty', 5, 2, 'Dr. John Smith');

// Update entire row
sheetManager.updateRow('Faculty', 5, ['FAC001', 'Dr. John Smith', ...]);
```

**Delete Operation:**
```javascript
sheetManager.deleteRow('Faculty', 5);
```

#### Return Data Structure

All query operations return data in a consistent format:

```javascript
{
  rowNumber: 5,           // 1-indexed row number in sheet
  data: {                 // Object with column headers as keys
    FacultyID: 'FAC001',
    Name: 'Dr. Smith',
    Email: 'smith@example.com',
    // ... other columns
  }
}
```

### 3. AuthService API

#### User Authentication

**Get Current User:**
```javascript
var authService = AuthService.getInstance();
var user = authService.getCurrentUser();

// Returns:
{
  email: 'smith@example.com',
  name: 'Dr. Smith',
  role: 'Admin',          // or 'Faculty' or 'Unknown'
  facultyId: 'FAC001',
  department: 'Cardiology',
  specialty: 'Interventional',
  rowNumber: 5
}
```

#### Role-Based Access Control

**Check Roles:**
```javascript
// Check specific role
if (authService.hasRole('Admin')) {
  // Admin operations
}

// Convenience methods
if (authService.isAdmin()) { }
if (authService.isFaculty()) { }
```

**Enforce Roles:**
```javascript
// Throws error if user doesn't have required role
var user = authService.requireAdmin();
var user = authService.requireFaculty();  // Allows Admin or Faculty
var user = authService.requireRole('Admin');
```

#### User Lookup

**Get User by Email:**
```javascript
var user = authService.getUserByEmail('smith@example.com');
// Returns user object or null if not found
```

**Get All Faculty:**
```javascript
var facultyList = authService.getAllFaculty();
// Returns array of user objects
```

### 4. Logger API

#### Logging Levels

The Logger supports four severity levels:

1. **INFO**: General information, successful operations
2. **WARNING**: Potential issues, non-critical problems
3. **ERROR**: Failures that don't stop execution (logged to AuditLog)
4. **CRITICAL**: Severe failures requiring immediate attention (logged to AuditLog)

#### Usage

**Basic Logging:**
```javascript
var logger = Logger.getInstance();

logger.info('User logged in', { email: user.email });
logger.warning('Potential data issue', { rowNumber: 5 });
logger.error('Failed to update record', { error: e.toString() });
logger.critical('Database corruption detected', { sheetName: 'Faculty' });
```

**Log Format:**
```javascript
{
  timestamp: '2026-02-12T10:30:45.123Z',
  level: 'ERROR',
  message: 'Failed to update record',
  metadata: { error: 'Range not found' }
}
```

#### Audit Trail

ERROR and CRITICAL level logs are automatically written to the AuditLog sheet:

| Timestamp | User | Action | Details | Metadata |
|-----------|------|--------|---------|----------|
| 2026-02-12T10:30:45.123Z | smith@example.com | ERROR_LOG | ERROR: Failed to update | {"error":"Range not found"} |

## Data Layer Schema

### Faculty Sheet Schema

```javascript
{
  FacultyID: 'FAC001',           // Primary key, string
  Name: 'Dr. John Smith',        // Full name
  Email: 'smith@med.edu',        // Authentication key, unique
  Department: 'Cardiology',      // Medical department
  Specialty: 'Interventional',   // Sub-specialty
  Role: 'Admin',                 // 'Admin' or 'Faculty'
  Phone: '555-0101',             // Contact number
  CreatedDate: Date              // Record creation timestamp
}
```

**Indexes:**
- Email (used for authentication)
- FacultyID (used for relationships)

### Schedule Sheet Schema

```javascript
{
  ScheduleID: 'SCH001',          // Primary key
  FacultyID: 'FAC001',           // Foreign key to Faculty
  FacultyName: 'Dr. John Smith', // Denormalized for display
  Date: Date,                    // Schedule date
  StartTime: '09:00',            // Time string (HH:MM)
  EndTime: '17:00',              // Time string (HH:MM)
  Location: 'Building A, 301',   // Physical location
  Type: 'Clinical Rounds',       // Schedule type
  Status: 'Confirmed',           // 'Confirmed', 'Pending', 'Cancelled'
  Notes: 'Regular clinic',       // Additional notes
  CreatedDate: Date,             // Record creation
  CreatedBy: 'admin@med.edu'     // Creator email
}
```

**Indexes:**
- FacultyID (for user's schedule lookup)
- Date (for date-based queries)
- ScheduleID (for swap requests)

### SwapRequests Sheet Schema

```javascript
{
  RequestID: 'SWP001',           // Primary key
  RequestorFacultyID: 'FAC002',  // Requesting faculty
  RequestorName: 'Dr. Johnson',  // Denormalized
  TargetFacultyID: 'FAC003',     // Target faculty
  TargetName: 'Dr. Chen',        // Denormalized
  OriginalScheduleID: 'SCH002',  // Foreign key
  RequestedScheduleID: 'SCH003', // Foreign key
  Status: 'Pending',             // 'Pending', 'Approved', 'Rejected'
  Reason: 'Family emergency',    // Swap reason
  RequestDate: Date,             // Request timestamp
  ResponseDate: Date,            // Response timestamp (null until responded)
  ResponseNotes: ''              // Admin response notes
}
```

**Indexes:**
- RequestorFacultyID (for user's requests)
- TargetFacultyID (for incoming requests)
- Status (for pending requests)

### AuditLog Sheet Schema

```javascript
{
  Timestamp: Date,               // Action timestamp
  User: 'smith@med.edu',         // User email or 'system'
  Action: 'CREATE_SCHEDULE',     // Action type
  Details: 'Created schedule...', // Human-readable description
  Metadata: '{"scheduleId":"SCH001"}' // JSON metadata
}
```

**Common Action Types:**
- `CREATE_SCHEDULE`, `UPDATE_SCHEDULE`, `DELETE_SCHEDULE`
- `CREATE_SWAP_REQUEST`, `APPROVE_SWAP`, `REJECT_SWAP`
- `ADD_FACULTY`, `UPDATE_FACULTY`, `REMOVE_FACULTY`
- `ERROR_LOG` (automatic from Logger)

## Error Handling Strategy

### Three-Tier Error Handling

1. **Service Layer** (SheetManager, AuthService):
   - Catches all exceptions
   - Logs with context
   - Throws descriptive errors

2. **Business Logic Layer** (Code.gs functions):
   - Catches service errors
   - Logs user-facing errors
   - Shows user-friendly messages

3. **UI Layer**:
   - Displays alerts/dialogs
   - Never exposes stack traces to users

### Example Error Flow

```javascript
// Service layer
appendRow: function(sheetName, rowData) {
  try {
    var sheet = this.getSheet(sheetName);
    sheet.appendRow(rowData);
    logger.info('Row appended', { sheetName: sheetName });
    return sheet.getLastRow();
  } catch (e) {
    logger.error('Failed to append row', {
      sheetName: sheetName,
      error: e.toString()
    });
    throw new Error('Failed to append row to ' + sheetName + ': ' + e.toString());
  }
}

// Business logic layer
function createSchedule() {
  var logger = Logger.getInstance();
  var sheetManager = SheetManager.getInstance();

  try {
    var rowNumber = sheetManager.appendRow('Schedule', [...]);
    SpreadsheetApp.getUi().alert('Schedule created successfully!');
  } catch (e) {
    logger.error('Failed to create schedule', { error: e.toString() });
    SpreadsheetApp.getUi().alert('Error', 'Failed to create schedule. Please try again.');
  }
}
```

## OAuth Scopes and Permissions

### Required Scopes

Declared in `appsscript.json`:

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

### Scope Usage

| Scope | Used For | Components |
|-------|----------|------------|
| spreadsheets | Read/write sheet data | SheetManager |
| calendar | Create calendar events | (Future feature) |
| gmail.send | Email notifications | (Future feature) |
| script.container.ui | Custom menus, dialogs | Code.gs |
| userinfo.email | User authentication | AuthService |

### Authorization Flow

1. User opens spreadsheet
2. Menu appears (onOpen)
3. User clicks menu item
4. First time: Authorization prompt
5. User grants permissions
6. Function executes

## Performance Considerations

### Batch Operations

For bulk operations, minimize API calls:

```javascript
// Bad: Multiple calls
for (var i = 0; i < 100; i++) {
  sheetManager.appendRow('Schedule', data[i]);
}

// Good: Single batch operation
var sheet = sheetManager.getSheet('Schedule');
var rows = data.map(function(d) { return d; });
sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length)
     .setValues(rows);
```

### Caching

SheetManager doesn't cache data by design (ensures data freshness). For read-heavy operations in future versions, consider:

```javascript
// Cache faculty list for session
var cachedFaculty = null;
function getCachedFaculty() {
  if (!cachedFaculty) {
    cachedFaculty = SheetManager.getInstance().getAllRows('Faculty');
  }
  return cachedFaculty;
}
```

### Query Optimization

- Use `findRow` instead of `getAllRows` when looking for single record
- Use `queryByColumn` for indexed lookups
- Minimize full table scans

## Testing Strategy

### Unit Tests (Tests.gs)

Run comprehensive tests:
```javascript
runAllTests()  // Runs all test functions
```

Tests cover:
- Logger functionality
- SheetManager CRUD operations
- AuthService user lookup
- Sheet structure validation
- OAuth scope access

### Manual Testing

1. **Initialization Test**: Run `initializeSpreadsheet()` on fresh sheet
2. **Sample Data Test**: Add sample data, verify structure
3. **Authentication Test**: Check user role identification
4. **Permission Test**: Test admin-only functions as faculty user
5. **Error Handling Test**: Try operations with invalid data

### Performance Testing

```javascript
benchmarkSheetManager()  // Measures operation times
```

Typical performance (on standard Google Apps Script infrastructure):
- Append: 100-300ms
- Query: 50-200ms
- Update: 100-250ms
- Delete: 100-200ms

## Security Best Practices

### 1. Input Validation

Always validate user input before database operations:

```javascript
function validateEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function addFaculty(email, name, ...) {
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  // Proceed with database operation
}
```

### 2. Role-Based Access Control

Always check permissions before sensitive operations:

```javascript
function deleteSchedule(scheduleId) {
  var authService = AuthService.getInstance();
  authService.requireAdmin();  // Throws error if not admin

  // Safe to proceed
  var sheetManager = SheetManager.getInstance();
  // ...
}
```

### 3. Audit Logging

Log all critical operations:

```javascript
function approveSwapRequest(requestId) {
  var logger = Logger.getInstance();
  var user = authService.getCurrentUser();

  // Perform operation
  sheetManager.updateCell('SwapRequests', rowNumber, 8, 'Approved');

  // Log to audit trail
  logger.info('Swap request approved', {
    requestId: requestId,
    approvedBy: user.email
  });
}
```

### 4. Data Privacy

- Never log sensitive data (passwords, PHI)
- Use email as identifier, not names in logs
- Sanitize error messages before showing to users

## Deployment Checklist

- [ ] All .gs files uploaded to Apps Script editor
- [ ] appsscript.json configured with correct scopes
- [ ] Script saved and authorized
- [ ] `initializeSpreadsheet()` executed successfully
- [ ] All four sheets created with correct headers
- [ ] Sample data added (optional)
- [ ] Test function executed successfully
- [ ] Custom menu appears in spreadsheet
- [ ] User can authenticate and see their role
- [ ] Admin functions require admin role
- [ ] Errors are logged to AuditLog sheet

## Future Enhancements

### Phase 2: Swap Request Workflow
- Implement swap request creation UI
- Add approval/rejection workflow
- Email notifications for requests

### Phase 3: Calendar Integration
- Sync schedules to Google Calendar
- Create calendar events automatically
- Handle calendar conflicts

### Phase 4: Advanced Features
- Schedule conflict detection
- Recurring schedule templates
- Reporting dashboard
- Export to PDF/Excel
- Mobile-responsive HTML UI

## Troubleshooting

### Common Issues

**Issue: "Unable to get user email"**
- Cause: Script not authorized or user not logged in
- Solution: Re-run authorization, check OAuth scopes

**Issue: "Sheet not found"**
- Cause: Spreadsheet not initialized
- Solution: Run `initializeSpreadsheet()` from menu

**Issue: "Unauthorized: Admin role required"**
- Cause: User not in Faculty sheet or wrong role
- Solution: Add user to Faculty sheet with correct role

**Issue: Performance degradation**
- Cause: Large dataset, inefficient queries
- Solution: Use indexed queries, batch operations, consider archiving old data

## API Reference Quick Links

- **SheetManager**: SheetManager.gs:1
- **AuthService**: AuthService.gs:1
- **Logger**: Logger.gs:1
- **Initialize**: Initialize.gs:1
- **Main Entry**: Code.gs:1
- **Tests**: Tests.gs:1
