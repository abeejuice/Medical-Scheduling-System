# Audit Trail API Reference

## Quick Reference for Developers

---

## AuditService API

### Initialization
```javascript
var auditService = AuditService.getInstance();
```

### Core Logging Methods

#### logEvent(eventType, action, metadata)
Generic event logging.
```javascript
auditService.logEvent(
  AuditService.EventType.DATA_ACCESS,
  'User viewed faculty list',
  { recordCount: 10 }
);
```

#### logScheduleChange(action, eventId, metadata)
Log schedule modifications.
```javascript
auditService.logScheduleChange('create', 'EVT-123456', {
  facultyEmail: 'faculty@example.com',
  eventType: 'Lecture',
  createdBy: 'admin@example.com'
});
```

#### logSwapRequest(action, requestId, metadata)
Log swap request actions.
```javascript
auditService.logSwapRequest('approve', 'SWAP-123456', {
  requesterEmail: 'user1@example.com',
  targetEmail: 'user2@example.com',
  approverEmail: 'admin@example.com'
});
```

#### logAccessGranted(resource, metadata)
Log successful access.
```javascript
auditService.logAccessGranted('schedule-view', {
  facultyEmail: 'faculty@example.com'
});
```

#### logAccessDenied(resource, reason, metadata)
Log denied access.
```javascript
auditService.logAccessDenied('audit-log-query', 'Admin role required', {
  userRole: 'Faculty'
});
```

### Query Methods (Admin Only)

#### queryAuditLogs(filters)
Query audit logs with filters.
```javascript
var result = auditService.queryAuditLogs({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  actionType: 'SCHEDULE_CHANGE',
  resourceType: 'Schedule',
  userEmail: 'user@example.com',
  limit: 100
});

if (result.success) {
  var logs = result.logs;
  // Process logs
}
```

**Filter Options:**
- `startDate` (string) - ISO date string
- `endDate` (string) - ISO date string
- `actionType` (string) - Event type from EventType enum
- `resourceType` (string) - Resource type from ResourceType enum
- `userEmail` (string) - User email to filter by
- `limit` (number) - Maximum records to return

#### exportToCSV(filters)
Export audit logs to CSV.
```javascript
var result = auditService.exportToCSV({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

if (result.success) {
  var csv = result.csv;
  var recordCount = result.recordCount;
  // Process CSV
}
```

### Event Types
```javascript
AuditService.EventType.ACCESS_GRANTED
AuditService.EventType.ACCESS_DENIED
AuditService.EventType.AUTH_SUCCESS
AuditService.EventType.AUTH_FAILURE
AuditService.EventType.DATA_ACCESS
AuditService.EventType.DATA_MODIFICATION
AuditService.EventType.BULK_UPLOAD
AuditService.EventType.UNAUTHORIZED_ATTEMPT
AuditService.EventType.INPUT_VALIDATION_FAILURE
AuditService.EventType.SCHEDULE_CHANGE
AuditService.EventType.SWAP_REQUEST
```

### Resource Types
```javascript
AuditService.ResourceType.SCHEDULE
AuditService.ResourceType.FACULTY
AuditService.ResourceType.SWAP_REQUEST
AuditService.ResourceType.AUDIT_LOG
AuditService.ResourceType.BULK_UPLOAD
```

---

## SwapRequestService API

### Initialization
```javascript
var swapService = SwapRequestService.getInstance();
```

### Methods

#### createSwapRequest(requestData)
Create a new swap request.
```javascript
var result = swapService.createSwapRequest({
  TargetEmail: 'target@example.com',
  EventID: 'EVT-123456',
  Comments: 'Need to swap this shift'
});

if (result.success) {
  var requestId = result.requestId;
}
```

#### approveSwapRequest(requestId)
Approve a swap request (target faculty or admin).
```javascript
var result = swapService.approveSwapRequest('SWAP-123456');
```

#### rejectSwapRequest(requestId)
Reject a swap request (target faculty or admin).
```javascript
var result = swapService.rejectSwapRequest('SWAP-123456');
```

#### cancelSwapRequest(requestId)
Cancel a swap request (requester only).
```javascript
var result = swapService.cancelSwapRequest('SWAP-123456');
```

#### getMySwapRequests()
Get swap requests for current user.
```javascript
var result = swapService.getMySwapRequests();

if (result.success) {
  var requests = result.requests;
  // Process requests
}
```

---

## Server-Side Functions (Setup.gs)

These functions are callable from client-side HTML via `google.script.run`.

### Audit Log Functions

#### queryAuditLogs(filters)
Server-side wrapper for audit log queries.
```javascript
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onError)
  .queryAuditLogs({
    startDate: '2024-01-01',
    actionType: 'SCHEDULE_CHANGE'
  });
```

#### exportAuditLogsToCSV(filters)
Server-side wrapper for CSV export.
```javascript
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onError)
  .exportAuditLogsToCSV(filters);
```

#### showAuditLogViewer()
Show the audit log viewer UI (admin only).
```javascript
// Called from menu: Medical Scheduling → View Audit Logs
```

#### protectAuditLogSheet()
Protect the AuditLog sheet from modifications.
```javascript
// Called automatically during initializeWorkbook()
```

### Swap Request Functions

#### createSwapRequest(requestData)
Server-side wrapper for creating swap requests.
```javascript
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onError)
  .createSwapRequest({
    TargetEmail: 'target@example.com',
    EventID: 'EVT-123456'
  });
```

#### approveSwapRequest(requestId)
Server-side wrapper for approving swap requests.
```javascript
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onError)
  .approveSwapRequest('SWAP-123456');
```

#### rejectSwapRequest(requestId)
Server-side wrapper for rejecting swap requests.
```javascript
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onError)
  .rejectSwapRequest('SWAP-123456');
```

#### cancelSwapRequest(requestId)
Server-side wrapper for canceling swap requests.
```javascript
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onError)
  .cancelSwapRequest('SWAP-123456');
```

#### getMySwapRequests()
Server-side wrapper for getting user's swap requests.
```javascript
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onError)
  .getMySwapRequests();
```

---

## Response Format

All methods return objects with this structure:

### Success Response
```javascript
{
  success: true,
  // Method-specific data
  error: null
}
```

### Error Response
```javascript
{
  success: false,
  error: 'Error message here'
}
```

### Query Response
```javascript
{
  success: true,
  logs: [
    {
      Timestamp: '2024-01-15T10:30:45.123Z',
      Severity: 'SCHEDULE_CHANGE',
      Message: 'create schedule event: EVT-123456',
      Metadata: '{"eventId":"EVT-123456","facultyEmail":"faculty@example.com"}',
      UserEmail: 'admin@example.com',
      _rowNumber: 2,
      _values: [...]
    }
  ],
  error: null
}
```

### Export Response
```javascript
{
  success: true,
  csv: 'Timestamp,Event Type,Message,User Email,Metadata\n...',
  recordCount: 150,
  error: null
}
```

---

## Usage Examples

### Example 1: Log Schedule Creation
```javascript
var scheduleService = ScheduleService.getInstance();
var auditService = AuditService.getInstance();

// Create event
var eventId = 'EVT-' + new Date().getTime();

// Log the creation
auditService.logScheduleChange('create', eventId, {
  facultyEmail: 'faculty@example.com',
  eventType: 'Lecture',
  createdBy: Session.getActiveUser().getEmail()
});
```

### Example 2: Query Recent Access Denials
```javascript
var result = AuditService.getInstance().queryAuditLogs({
  actionType: 'ACCESS_DENIED',
  limit: 50
});

if (result.success) {
  result.logs.forEach(function(log) {
    Logger.log('Denied: ' + log.Message + ' by ' + log.UserEmail);
  });
}
```

### Example 3: Export Monthly Compliance Report
```javascript
var startDate = '2024-01-01';
var endDate = '2024-01-31';

var result = AuditService.getInstance().exportToCSV({
  startDate: startDate,
  endDate: endDate
});

if (result.success) {
  // Save CSV or send to compliance system
  Logger.log('Exported ' + result.recordCount + ' records');
}
```

### Example 4: Create and Approve Swap Request
```javascript
var swapService = SwapRequestService.getInstance();

// Create request
var createResult = swapService.createSwapRequest({
  TargetEmail: 'faculty2@example.com',
  EventID: 'EVT-123456',
  Comments: 'Need to swap due to conference'
});

if (createResult.success) {
  var requestId = createResult.requestId;

  // Later, approve as target faculty
  var approveResult = swapService.approveSwapRequest(requestId);

  if (approveResult.success) {
    Logger.log('Swap request approved');
  }
}
```

---

## Security Notes

1. **Admin-Only Functions**: `queryAuditLogs()` and `exportToCSV()` require Admin role
2. **User Email**: Automatically captured from `Session.getActiveUser()`
3. **Input Sanitization**: All inputs sanitized via `SecurityUtils.sanitizeObject()`
4. **Audit Logging**: All access attempts (granted/denied) are logged
5. **Authorization**: Swap requests check requester/target/admin roles

---

## Error Handling

All methods handle errors gracefully:

```javascript
try {
  var result = auditService.queryAuditLogs(filters);
  if (!result.success) {
    // Handle error
    Logger.error('Query failed: ' + result.error);
  }
} catch (e) {
  // Handle exception
  Logger.error('Exception: ' + e.toString());
}
```

---

## Performance Considerations

1. **Large Datasets**: Use `limit` parameter to reduce query size
2. **Date Ranges**: Always specify date range for better performance
3. **Caching**: Services use singleton pattern for efficiency
4. **Batch Operations**: Use bulk methods when possible

---

## Support & Documentation

For more information:
- **AUDIT_TRAIL_GUIDE.md** - Complete implementation guide
- **AUDIT_TRAIL_QUICK_START.md** - Quick start for admins
- **AUDIT_TRAIL_IMPLEMENTATION_COMPLETE.md** - Technical details
- Inline code comments in all `.gs` files
