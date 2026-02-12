# Audit Trail - Quick Start Guide

## For Administrators

### View Audit Logs
1. Open the Medical Scheduling spreadsheet
2. Click **Medical Scheduling → 🔍 View Audit Logs (Admin)**
3. The viewer opens with last 30 days of logs
4. Click **🔍 Query Logs** to refresh

### Filter Logs
- **Date Range**: Set start and end dates
- **Action Type**: Select event type (e.g., SCHEDULE_CHANGE)
- **Resource Type**: Select resource (e.g., Schedule)
- **User Email**: Enter specific user email
- **Limit**: Choose number of records
- Click **🔍 Query Logs** to apply filters

### Export Logs
1. Apply desired filters (optional)
2. Click **📥 Export to CSV**
3. File downloads as `audit_logs_YYYY-MM-DD.csv`
4. Open in Excel or compliance system

### Clear Filters
- Click **🔄 Clear Filters** to reset to defaults

---

## What Gets Logged?

### Schedule Events
- ✅ Creating schedule events
- ✅ Updating schedule events
- ✅ Deleting schedule events
- ✅ Viewing schedules

### Swap Requests
- ✅ Creating swap requests
- ✅ Approving swap requests
- ✅ Rejecting swap requests
- ✅ Canceling swap requests

### Access & Security
- ✅ Authentication attempts
- ✅ Access granted events
- ✅ Access denied events
- ✅ Unauthorized access attempts
- ✅ Input validation failures

### Data Operations
- ✅ Bulk uploads
- ✅ Data modifications
- ✅ Data access

---

## Event Types

| Event Type | Description |
|------------|-------------|
| SCHEDULE_CHANGE | Schedule created/updated/deleted |
| SWAP_REQUEST | Swap request action |
| ACCESS_GRANTED | Access successfully granted |
| ACCESS_DENIED | Access denied |
| AUTH_SUCCESS | User authenticated |
| AUTH_FAILURE | Authentication failed |
| DATA_ACCESS | Data read operation |
| DATA_MODIFICATION | Data write operation |
| BULK_UPLOAD | Bulk data upload |
| UNAUTHORIZED_ATTEMPT | Unauthorized access attempt |
| INPUT_VALIDATION_FAILURE | Invalid input detected |

---

## Resource Types

| Resource Type | Description |
|---------------|-------------|
| Schedule | Schedule events |
| Faculty | Faculty records |
| SwapRequest | Swap requests |
| AuditLog | Audit log access |
| BulkUpload | Bulk upload operations |

---

## Common Filters

### Last 7 Days
- Start Date: 7 days ago
- End Date: Today
- Action Type: All
- Limit: 100

### Schedule Changes Only
- Date Range: Last 30 days
- Action Type: SCHEDULE_CHANGE
- Resource Type: Schedule
- Limit: 500

### Failed Access Attempts
- Date Range: Last 30 days
- Action Type: ACCESS_DENIED
- Limit: 100

### Specific User Activity
- Date Range: Last 30 days
- User Email: user@example.com
- Limit: 100

---

## Security Notes

### ✅ Immutable Logs
- Audit log records cannot be edited or deleted
- Protection automatically applied
- Warning shown on edit attempts

### ✅ Admin-Only Access
- Only Admin role can view audit logs
- Non-admin access attempts are logged
- Menu item only shows for admins

### ✅ Comprehensive Logging
- Every action is logged with user email and timestamp
- Access attempts (both granted and denied) are logged
- Metadata provides detailed context

---

## Troubleshooting

### Menu Item Not Showing
- Verify you have Admin role in Faculty sheet
- Refresh the spreadsheet
- Check that you're logged in

### No Logs Appearing
- Check date range filters
- Try "All Actions" for action type
- Try removing user email filter
- Check that AuditLog sheet exists

### Export Not Working
- Check browser pop-up blocker
- Allow downloads from Google
- Try a different browser

### Can't Edit Audit Log Sheet
- This is normal! Logs are immutable
- Warning message is expected
- Do not override the protection

---

## Support

For detailed documentation, see:
- **AUDIT_TRAIL_GUIDE.md** - Complete implementation guide
- **AUDIT_TRAIL_IMPLEMENTATION_COMPLETE.md** - Technical details

For help:
- Contact your system administrator
- Check the deployment guide
- Review the security documentation
