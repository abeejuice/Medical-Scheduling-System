# Security Implementation Guide

## Overview
This document describes the comprehensive security and authorization implementation for the Medical Scheduling System, addressing all acceptance criteria for securing the system against unauthorized access and malicious input.

## Acceptance Criteria Implementation

### ✅ 1. Non-admin users cannot access upload endpoint
**Implementation:**
- `Setup.gs:previewBulkData()` - Checks if user is admin before allowing preview
- `Setup.gs:commitBulkData()` - Checks if user is admin before allowing commit
- Returns 'Access denied' error message for non-admin users
- All unauthorized attempts are logged to AuditLog

**Files:**
- `Setup.gs` (lines 292-334, 336-384)

**Test:**
```javascript
// As a Faculty user, call:
previewBulkData(testData, 'faculty');
// Expected: { success: false, error: 'Access denied: Only administrators can perform bulk uploads' }
```

### ✅ 2. Faculty users can only view and modify their own schedule
**Implementation:**
- `ScheduleService.gs` - New service enforcing schedule access control
- `canAccessSchedule()` - Validates that faculty can only access their own schedule
- `getSchedule()` - Returns only the current user's schedule for faculty users
- `updateEvent()` - Prevents faculty from updating other faculty's events
- `deleteEvent()` - Prevents faculty from deleting other faculty's events
- Admins can access all schedules

**Files:**
- `ScheduleService.gs` (entire file)
- `Setup.gs` (lines 397-462)

**Test:**
```javascript
// As faculty@example.com, try to access another-faculty@example.com's schedule:
getSchedule('another-faculty@example.com');
// Expected: { success: false, error: 'Access denied: Faculty can only access their own schedule' }

// As faculty@example.com, access own schedule:
getSchedule('faculty@example.com');
// Expected: { success: true, events: [...] }
```

### ✅ 3. HTML/script tags in user input are escaped
**Implementation:**
- `SecurityUtils.gs` - Comprehensive input sanitization utilities
- `escapeHtml()` - Converts `<script>` to `&lt;script&gt;`
- `sanitizeInput()` - Escapes all HTML entities (&, <, >, ", ', /)
- All user input is sanitized before storage
- Tags are rendered as literal text, not executed

**Files:**
- `SecurityUtils.gs` (entire file)
- `BulkUploadService.gs` (lines 44-46, 52-54, 268-307, 318-355)

**Test:**
```javascript
// Test HTML escaping:
SecurityUtils.escapeHtml('<script>alert("XSS")</script>');
// Expected: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'

// Test sanitization in bulk upload:
var testData = 'Name\tEmail\n<script>alert(1)</script>\ttest@example.com';
previewBulkData(testData, 'faculty');
// Expected: Name field contains escaped HTML, not executable script
```

### ✅ 4. All user input is validated and sanitized
**Implementation:**
- `SecurityUtils.gs` - Validation functions:
  - `validateInput()` - Comprehensive validation with options
  - `validateNoScriptTags()` - Detects script tags and event handlers
  - `validateLength()` - Enforces maximum length
  - `isValidEmail()` - Validates email format
- `BulkUploadService.gs` - Enhanced validation:
  - Faculty rows: Email, Name, Role validation with sanitization
  - Event rows: All text fields validated and sanitized
  - Maximum length enforcement (255 chars for names, 2000 for descriptions)
- All validation failures logged to AuditLog

**Files:**
- `SecurityUtils.gs` (lines 98-221)
- `BulkUploadService.gs` (lines 262-355, 357-444)

**Test:**
```javascript
// Test input validation:
SecurityUtils.validateInput('<script>alert(1)</script>', { required: true });
// Expected: { isValid: false, errors: ['Script tags are not allowed'], ... }

// Test length validation:
SecurityUtils.validateInput('a'.repeat(300), { maxLength: 255 });
// Expected: { isValid: false, errors: ['Input exceeds maximum length...'], ... }

// Test email validation:
SecurityUtils.validateInput('invalid-email', { isEmail: true });
// Expected: { isValid: false, errors: ['Invalid email format'], ... }
```

### ✅ 5. Audit log records every access attempt
**Implementation:**
- `AuditService.gs` - Comprehensive audit logging service
- Logs all events to `AuditLog` sheet with:
  - Timestamp (ISO format)
  - Event type (ACCESS_GRANTED, ACCESS_DENIED, etc.)
  - Action description
  - Metadata (JSON)
  - User email
- Event types logged:
  - `ACCESS_GRANTED` - Successful access to resources
  - `ACCESS_DENIED` - Failed access attempts
  - `AUTH_SUCCESS` - Successful authentication
  - `AUTH_FAILURE` - Failed authentication
  - `UNAUTHORIZED_ATTEMPT` - Attempts to access unauthorized resources
  - `DATA_ACCESS` - Data read operations
  - `DATA_MODIFICATION` - Data create/update/delete operations
  - `BULK_UPLOAD` - Bulk upload operations
  - `INPUT_VALIDATION_FAILURE` - XSS/malicious input attempts

**Files:**
- `AuditService.gs` (entire file)
- `AuthService.gs` (lines 59-75, 139-155)
- `Setup.gs` (lines 305-321, 355-372)
- `ScheduleService.gs` (throughout)

**Test:**
```javascript
// View audit log for current user:
var auditService = AuditService.getInstance();
var logs = auditService.getUserAuditLogs(Session.getActiveUser().getEmail(), 10);
// Expected: Array of audit entries with timestamps, event types, and metadata

// View recent access denied events:
var deniedEvents = auditService.getAccessDeniedEvents(10);
// Expected: Array of unauthorized access attempts
```

## Security Components

### 1. SecurityUtils.gs
**Purpose:** Input validation and sanitization to prevent XSS attacks

**Key Functions:**
- `escapeHtml(input)` - Escapes HTML special characters
- `sanitizeInput(input)` - Trims and escapes user input
- `sanitizeObject(obj)` - Recursively sanitizes object properties
- `sanitizeArray(arr)` - Sanitizes array elements
- `validateInput(input, options)` - Comprehensive validation
- `validateNoScriptTags(input)` - Detects XSS attempts
- `stripHtmlTags(input)` - Removes all HTML tags

**Usage Example:**
```javascript
var userInput = '<script>alert("XSS")</script>Hello';
var safe = SecurityUtils.sanitizeInput(userInput);
// safe = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;Hello'
```

### 2. AuditService.gs
**Purpose:** Comprehensive audit logging for security events

**Key Functions:**
- `logAccessGranted(resource, metadata)` - Log successful access
- `logAccessDenied(resource, reason, metadata)` - Log denied access
- `logAuthSuccess(role, metadata)` - Log authentication success
- `logAuthFailure(reason, metadata)` - Log authentication failure
- `logUnauthorizedAttempt(resource, required, actual, metadata)` - Log unauthorized attempts
- `logDataModification(resource, operation, metadata)` - Log data changes
- `logBulkUpload(dataType, count, metadata)` - Log bulk operations
- `logInputValidationFailure(field, reason, metadata)` - Log XSS attempts
- `getUserAuditLogs(email, limit)` - Retrieve user's audit logs
- `getAccessDeniedEvents(limit)` - Retrieve denied access attempts

**Usage Example:**
```javascript
var auditService = AuditService.getInstance();
auditService.logAccessDenied('bulk-upload', 'Admin role required', {
  userRole: 'Faculty',
  requestedResource: 'previewBulkData'
});
```

### 3. ScheduleService.gs
**Purpose:** Schedule access control - faculty can only view/modify own schedules

**Key Functions:**
- `canAccessSchedule(facultyEmail)` - Check access permissions
- `getSchedule(facultyEmail, filters)` - Get schedule with access control
- `updateEvent(eventId, updates)` - Update event with authorization
- `deleteEvent(eventId)` - Delete event with authorization
- `createEvent(eventData)` - Create event with validation and sanitization

**Access Rules:**
- **Admin:** Can access all schedules
- **Faculty:** Can only access their own schedule
- **Guest:** Cannot access any schedules

**Usage Example:**
```javascript
var scheduleService = ScheduleService.getInstance();

// Faculty accessing their own schedule:
var result = scheduleService.getSchedule('faculty@example.com');
// result.success = true (if faculty@example.com is current user)

// Faculty trying to access another's schedule:
var result = scheduleService.getSchedule('other-faculty@example.com');
// result.success = false, error = 'Access denied: Faculty can only access their own schedule'
```

## API Endpoints with Security

### Bulk Upload Endpoints

#### `previewBulkData(rawData, dataType)`
**Authorization:** Admin only
**Security Features:**
- Checks user role before processing
- Logs all access attempts (success and failure)
- Returns 'Access denied' error for non-admins
- Sanitizes all input data before validation

#### `commitBulkData(validatedRows, dataType)`
**Authorization:** Admin only
**Security Features:**
- Checks user role before processing
- Logs all access attempts and bulk upload operations
- Returns 'Access denied' error for non-admins
- All data is pre-sanitized during preview

### Schedule Endpoints

#### `getSchedule(facultyEmail, filters)`
**Authorization:** Faculty (own schedule only), Admin (all schedules)
**Security Features:**
- Validates user can access requested schedule
- Logs all access attempts
- Returns only authorized data

#### `updateScheduleEvent(eventId, updates)`
**Authorization:** Faculty (own events only), Admin (all events)
**Security Features:**
- Validates user owns the event
- Sanitizes all update values
- Logs all modification attempts

#### `deleteScheduleEvent(eventId)`
**Authorization:** Faculty (own events only), Admin (all events)
**Security Features:**
- Validates user owns the event
- Soft delete (sets Status to Inactive)
- Logs all deletion attempts

#### `createScheduleEvent(eventData)`
**Authorization:** Faculty (own schedule only), Admin (any schedule)
**Security Features:**
- Validates and sanitizes all input
- Checks maximum length constraints
- Logs all creation attempts

## Data Flow with Security

### Input Processing Flow
```
User Input
    ↓
SecurityUtils.sanitizeInput()
    ↓ (HTML entities escaped)
SecurityUtils.validateInput()
    ↓ (Validation checks: length, format, no scripts)
Storage in Google Sheets
    ↓ (Sanitized data)
Display to Users
    ↓ (HTML entities render as text, not code)
Safe Output
```

### Access Control Flow
```
User Request
    ↓
AuthService.getCurrentUser()
    ↓ (Get user role)
AuthService.requireRole() OR ScheduleService.canAccessSchedule()
    ↓ (Check authorization)
    ├─ Authorized → AuditService.logAccessGranted() → Process Request
    └─ Not Authorized → AuditService.logAccessDenied() → Return Error
```

## Audit Log Schema

The `AuditLog` sheet contains the following columns:

| Column | Type | Description |
|--------|------|-------------|
| Timestamp | ISO Date String | When the event occurred |
| Severity | String | Event type (ACCESS_GRANTED, ACCESS_DENIED, etc.) |
| Message | String | Human-readable description |
| Metadata | JSON String | Additional context (user roles, resources, etc.) |
| UserEmail | String | Email of user who triggered the event |

### Sample Audit Log Entries

**Successful Authentication:**
```
Timestamp: 2024-02-15T10:30:00.000Z
Severity: AUTH_SUCCESS
Message: User authenticated successfully
Metadata: {"role":"Admin","email":"admin@medical.edu","name":"Dr. Admin User"}
UserEmail: admin@medical.edu
```

**Unauthorized Upload Attempt:**
```
Timestamp: 2024-02-15T10:35:00.000Z
Severity: UNAUTHORIZED_ATTEMPT
Message: Unauthorized attempt to access bulk-upload-commit
Metadata: {"resource":"bulk-upload-commit","requiredRole":"Admin","actualRole":"Faculty","dataType":"faculty","rowCount":5}
UserEmail: faculty@medical.edu
```

**XSS Attempt:**
```
Timestamp: 2024-02-15T10:40:00.000Z
Severity: INPUT_VALIDATION_FAILURE
Message: Input validation failed for Name: Script tags are not allowed
Metadata: {"fieldName":"Name","validationFailureReason":"Script tags are not allowed","value":"<script>alert('XSS')</script>"}
UserEmail: admin@medical.edu
```

**Cross-User Schedule Access Attempt:**
```
Timestamp: 2024-02-15T10:45:00.000Z
Severity: ACCESS_DENIED
Message: Access denied to schedule-view
Metadata: {"targetFacultyEmail":"john.doe@medical.edu","requestorEmail":"jane.smith@medical.edu","requestorRole":"Faculty","denialReason":"Faculty can only access their own schedule"}
UserEmail: jane.smith@medical.edu
```

## Testing Security Features

### Test 1: Bulk Upload Authorization
```javascript
// As Faculty user:
function testBulkUploadAuth() {
  var testData = 'Email\tName\tRole\ntest@example.com\tTest User\tFaculty';
  var result = previewBulkData(testData, 'faculty');

  Logger.log('Test Result: ' + JSON.stringify(result));
  // Expected: { success: false, error: 'Access denied: Only administrators can perform bulk uploads' }

  // Check audit log
  var auditService = AuditService.getInstance();
  var recentLogs = auditService.getUserAuditLogs(Session.getActiveUser().getEmail(), 1);
  Logger.log('Audit Log: ' + JSON.stringify(recentLogs[0]));
  // Expected: ACCESS_DENIED entry
}
```

### Test 2: Schedule Access Control
```javascript
// As Faculty user trying to access another faculty's schedule:
function testScheduleAccessControl() {
  var scheduleService = ScheduleService.getInstance();
  var currentEmail = Session.getActiveUser().getEmail();
  var otherEmail = 'other-faculty@medical.edu'; // Different from current user

  var result = scheduleService.getSchedule(otherEmail);
  Logger.log('Test Result: ' + JSON.stringify(result));
  // Expected: { success: false, error: 'Access denied: Faculty can only access their own schedule' }

  // Check audit log
  var auditService = AuditService.getInstance();
  var recentLogs = auditService.getUserAuditLogs(currentEmail, 1);
  Logger.log('Audit Log: ' + JSON.stringify(recentLogs[0]));
  // Expected: ACCESS_DENIED entry with targetFacultyEmail metadata
}
```

### Test 3: XSS Prevention
```javascript
function testXSSPrevention() {
  var maliciousInputs = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '<div onclick="alert(1)">Click</div>',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)"></iframe>'
  ];

  maliciousInputs.forEach(function(input) {
    var sanitized = SecurityUtils.sanitizeInput(input);
    Logger.log('Input: ' + input);
    Logger.log('Sanitized: ' + sanitized);
    // Expected: All HTML tags and dangerous characters are escaped

    var validation = SecurityUtils.validateNoScriptTags(input);
    Logger.log('Validation: ' + JSON.stringify(validation));
    // Expected: { isValid: false, reason: '...' }
  });
}
```

### Test 4: Audit Log Verification
```javascript
function testAuditLogging() {
  var auditService = AuditService.getInstance();

  // Trigger various events
  try {
    AuthService.getInstance().requireAdmin(); // Will fail if not admin
  } catch (e) {
    // Expected to fail for non-admin users
  }

  // Check audit logs
  var logs = auditService.getUserAuditLogs(Session.getActiveUser().getEmail(), 10);
  Logger.log('Recent Audit Logs:');
  logs.forEach(function(log) {
    Logger.log('  ' + log.Timestamp + ' | ' + log.Severity + ' | ' + log.Message);
  });

  // Check access denied events
  var deniedEvents = auditService.getAccessDeniedEvents(5);
  Logger.log('Recent Access Denied Events:');
  deniedEvents.forEach(function(event) {
    Logger.log('  ' + event.Timestamp + ' | ' + event.UserEmail + ' | ' + event.Message);
  });
}
```

## Deployment Checklist

- [x] `SecurityUtils.gs` - Input validation and sanitization utilities
- [x] `AuditService.gs` - Comprehensive audit logging
- [x] `ScheduleService.gs` - Schedule access control service
- [x] `BulkUploadService.gs` - Updated with input sanitization
- [x] `AuthService.gs` - Enhanced with audit logging
- [x] `Setup.gs` - Updated API endpoints with authorization checks
- [x] `AuditLog` sheet - Created by `initializeWorkbook()`

All files are ready for deployment to Google Apps Script.

## Maintenance and Monitoring

### Regular Security Checks

1. **Review Audit Logs:** Periodically check for unusual patterns
   ```javascript
   var auditService = AuditService.getInstance();
   var deniedEvents = auditService.getAccessDeniedEvents(50);
   // Look for repeated attempts from same user
   ```

2. **Monitor Input Validation Failures:** Check for XSS attempts
   ```javascript
   var sheetManager = SheetManager.getInstance();
   var validationFailures = sheetManager.queryRows('AuditLog', function(row) {
     return row.Severity === 'INPUT_VALIDATION_FAILURE';
   });
   ```

3. **Review Cross-User Access Attempts:** Monitor for unauthorized access patterns
   ```javascript
   var logs = sheetManager.queryRows('AuditLog', function(row) {
     return row.Message.indexOf('cross-user access') > -1;
   });
   ```

## Summary

This implementation provides comprehensive security coverage:

1. ✅ **Authorization:** Role-based access control with admin-only bulk upload
2. ✅ **Access Control:** Faculty can only view/modify their own schedules
3. ✅ **XSS Prevention:** All HTML/script tags are escaped and rendered as text
4. ✅ **Input Validation:** All user input is validated and sanitized before storage
5. ✅ **Audit Logging:** Every access attempt (success and failure) is logged with user email and timestamp

All acceptance criteria have been met with production-ready, tested code.
