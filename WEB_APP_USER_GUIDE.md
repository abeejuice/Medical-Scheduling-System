# Medical Scheduling System - Web App User Guide

## 🏥 Welcome to the Medical Scheduling System

This guide explains how to use the web-based Medical Scheduling System for faculty and administrators.

---

## 🌐 Accessing the System

### Getting Your Access URL

Your administrator will provide you with a web app URL that looks like:
```
https://script.google.com/macros/s/[YOUR_DEPLOYMENT_ID]/exec
```

**Bookmark this URL** for easy access from any device!

### First-Time Access

1. Click the web app URL
2. Sign in with your Google account (same email as in Faculty sheet)
3. Click "Allow" to grant permissions (first time only)
4. You'll see the home page with your user information

---

## 👥 User Roles

### Faculty
- ✅ View your own schedule
- ✅ See countdown to next duty
- ✅ Request duty swaps
- ✅ View upcoming events

### Admin
- ✅ Everything Faculty can do, PLUS:
- ✅ Upload faculty and event data
- ✅ View audit logs
- ✅ Manage system configuration
- ✅ View all schedules

---

## 📱 Using the Web App

### Home Page

When you open the web app, you'll see:

**Your Information:**
- Name and email
- Role (Faculty or Admin)
- Department

**Navigation Cards:**
- **📅 My Schedule** - View your upcoming duties
- **⚙️ Admin Panel** - (Admin only) Manage data
- **🔍 Audit Logs** - (Admin only) View system logs

**System Status:**
- Shows if system is operational
- Last updated timestamp

---

## 📅 Viewing Your Schedule

### Accessing Your Schedule

1. Click **"My Schedule"** card on home page
2. Your schedule page opens with:
   - Your name and email at top
   - Countdown timer to your next duty
   - List of upcoming duties

### Schedule Information

Each duty shows:
- **Event Type** - Type of duty (Call, Clinic, etc.)
- **Date & Time** - When it starts and ends
- **Location** - Where you need to be
- **Description** - Additional details
- **Status** - Active or changed

### Countdown Timer

At the top of your schedule:
- Shows time remaining until your next duty
- Updates in real-time
- Displays "No upcoming duties" if schedule is clear

### Using Your Schedule

**From Any Device:**
- Desktop computer at work
- Laptop at home
- Tablet
- Smartphone browser

**Bookmarks:**
Direct link to your schedule:
```
[Your Web App URL]?page=schedule
```

---

## ⚙️ Admin Panel (Administrators Only)

### Accessing Admin Panel

1. Click **"Admin Panel"** card on home page
2. Bulk upload interface opens

### Uploading Faculty

1. Select **"Faculty"** tab
2. Prepare data in spreadsheet:
   ```
   Email                   Name              Role     Department      ContactNumber  Status
   john.doe@medical.edu    Dr. John Doe      Faculty  Cardiology      555-0001      Active
   jane.smith@medical.edu  Dr. Jane Smith    Faculty  Neurology       555-0002      Active
   ```
3. Copy all cells (including headers)
4. Paste into text box
5. Click **"Preview"**
6. Review validation results:
   - ✅ Green = Valid
   - ⚠️ Yellow = Warning
   - ❌ Red = Error
7. Fix any errors
8. Click **"Commit to Sheet"**

### Uploading Events

1. Select **"Events"** tab
2. Prepare data in spreadsheet:
   ```
   FacultyEmail            EventType  StartDateTime        EndDateTime          Location       Description
   john.doe@medical.edu    Call       2026-02-15 08:00    2026-02-15 18:00    Main Hospital  Weekend call
   jane.smith@medical.edu  Clinic     2026-02-16 09:00    2026-02-16 17:00    Clinic A       Neurology clinic
   ```
3. Copy all cells (including headers)
4. Paste into text box
5. Click **"Preview"**
6. Review validation results
7. Fix any errors
8. Click **"Commit to Sheet"**

### Bulk Upload Tips

**Date Formats:**
- ✅ YYYY-MM-DD HH:MM (e.g., 2026-02-15 08:00)
- ✅ ISO 8601 (e.g., 2026-02-15T08:00:00)
- ❌ MM/DD/YYYY (ambiguous, may cause warnings)

**Email Format:**
- Must match Google account email exactly
- Case-sensitive
- Valid email format required

**Required Fields:**
- Faculty: Email, Name, Role, Status
- Events: FacultyEmail, EventType, StartDateTime, EndDateTime

---

## 🔍 Audit Logs (Administrators Only)

### Accessing Audit Logs

1. Click **"Audit Logs"** card on home page
2. Audit log viewer opens

### Viewing Logs

**Filter Options:**
- Event Type (access, errors, etc.)
- Date range
- User email
- Severity level

**Log Information:**
- Timestamp - When event occurred
- User - Who performed action
- Event Type - Category of event
- Action - What happened
- Metadata - Additional details

### Exporting Logs

1. Apply filters if needed
2. Click **"Export to CSV"**
3. Download file opens
4. Use for compliance or analysis

### Common Event Types

- **ACCESS_GRANTED** - Successful page access
- **ACCESS_DENIED** - Unauthorized access attempt
- **CALENDAR_SYNC** - Automated calendar sync
- **BULK_UPLOAD** - Data upload operations
- **SCHEDULE_CHANGE** - Schedule modifications

---

## 🔄 Calendar Integration

### How It Works

The system automatically syncs your schedule to Google Calendar:

1. **Daily Sync** - Runs every day at 2:00 AM
2. **Event Creation** - New duties added to calendar
3. **Event Updates** - Changes reflected in calendar
4. **Event Deletion** - Removed duties deleted from calendar

### Your Google Calendar

**Finding Events:**
- Open Google Calendar
- Look for events titled: "[Event Type] - [Your Email]"
- Events include all duty details

**Event Details:**
- Title - Type and faculty
- Time - Start and end times
- Location - Where to go
- Description - Full duty information

**Automatic Updates:**
- Changes sync overnight
- No manual action needed
- Always shows current schedule

---

## 📱 Mobile Access

### Using on Mobile

**Works On:**
- iPhone Safari
- Android Chrome
- Any modern mobile browser

**Features:**
- View schedule on the go
- See countdown timer
- Check duty details
- Access from anywhere

**Mobile Tips:**
- Bookmark web app URL
- Add to home screen for app-like experience
- Enable notifications (browser dependent)

---

## 🆘 Troubleshooting

### Can't Access Web App

**Problem:** "Access Denied" message

**Solutions:**
1. Verify you're using correct Google account
2. Check your email is in Faculty sheet
3. Ensure Status is "Active"
4. Contact administrator to add you

---

### Schedule Not Showing

**Problem:** No duties displayed

**Solutions:**
1. Check if you have any scheduled duties
2. Verify Faculty sheet has your email
3. Look in Schedule sheet for your events
4. Contact administrator

---

### Calendar Not Syncing

**Problem:** Google Calendar doesn't match

**Solutions:**
1. Wait until 2 AM for next sync
2. Check if events are in Schedule sheet
3. Ask admin to run manual sync
4. Verify calendar permissions granted

---

### Bulk Upload Errors

**Problem:** Upload fails or shows errors

**Solutions:**
1. Check date format (YYYY-MM-DD HH:MM)
2. Verify all required fields present
3. Check email addresses are valid
4. Review validation messages
5. Fix highlighted errors

---

## 💡 Tips & Best Practices

### For Faculty

**Check Schedule Regularly:**
- Bookmark the schedule page
- Check before planning personal activities
- Note the countdown to next duty

**Keep Info Updated:**
- Contact admin if email changes
- Update contact number when needed
- Report any schedule errors immediately

**Plan Ahead:**
- Note upcoming duties
- Arrange swaps in advance
- Set personal calendar reminders

### For Administrators

**Data Quality:**
- Double-check dates before upload
- Verify email addresses match exactly
- Use consistent date format
- Review preview before committing

**Regular Maintenance:**
- Review audit logs weekly
- Check sync execution history
- Update faculty list as needed
- Export logs monthly for compliance

**Monitor System:**
- Check for error patterns
- Verify trigger is running
- Test changes before deploying
- Keep documentation updated

---

## 🔐 Security & Privacy

### Data Protection

**Your Data:**
- Only you can see your schedule
- Admins can view all schedules
- All access is logged

**Authentication:**
- Google account required
- Role-based access control
- Unauthorized attempts logged

**Audit Trail:**
- Every action logged
- Immutable audit records
- Admin access to logs only

### Best Practices

**Account Security:**
- Use strong Google password
- Enable 2-factor authentication
- Don't share account credentials
- Log out on shared computers

**Data Privacy:**
- Don't share web app URL publicly
- Report suspicious access
- Review audit logs (admins)
- Keep schedule information confidential

---

## 📞 Getting Help

### Contact Your Administrator

For issues with:
- Access problems
- Schedule errors
- Missing duties
- System questions

### Self-Service Checks

Before contacting admin:
1. Verify you're logged in correctly
2. Check Faculty sheet has your email
3. Refresh the web page
4. Try different browser
5. Clear browser cache

---

## 🎯 Quick Reference

### URLs

**Home Page:**
```
[Your Web App URL]
```

**My Schedule:**
```
[Your Web App URL]?page=schedule
```

**Admin Panel:**
```
[Your Web App URL]?page=admin
```

**Audit Logs:**
```
[Your Web App URL]?page=audit
```

### Keyboard Shortcuts

- **Ctrl+R** or **F5** - Refresh page
- **Ctrl+D** - Bookmark page
- **Ctrl+Click** - Open link in new tab

### Common Tasks

| Task | Steps |
|------|-------|
| View Schedule | Home → My Schedule |
| Upload Faculty | Home → Admin → Faculty tab → Paste → Preview → Commit |
| Upload Events | Home → Admin → Events tab → Paste → Preview → Commit |
| Check Logs | Home → Audit Logs → Filter → View |
| Export Logs | Audit Logs → Export CSV |

---

## 🔄 System Automation

### What Runs Automatically

**Daily at 2:00 AM:**
- Calendar sync runs
- New events created
- Existing events updated
- Deleted events removed
- All operations logged

**On Every Access:**
- User authentication
- Authorization check
- Access logging
- Error logging

**Real-Time:**
- Schedule queries
- Role enforcement
- Input validation
- Audit trail recording

### No Manual Steps

✅ Calendar stays in sync automatically
✅ Changes propagate overnight
✅ Errors logged and tracked
✅ System monitors itself
✅ Audit trail maintained

---

## ✅ Summary

**The Medical Scheduling System provides:**

✅ **Easy Access** - Web-based, works on any device
✅ **Role-Based** - Faculty and admin features
✅ **Automated** - Calendar syncs daily
✅ **Secure** - Protected access, audit trail
✅ **Reliable** - Error logging and monitoring

**Getting Started:**
1. Bookmark the web app URL
2. Sign in with your Google account
3. Click "My Schedule" to view duties
4. Check regularly for updates

**Need Help?**
- Contact your administrator
- Check this guide for common tasks
- Review troubleshooting section

---

**Version:** 1.0
**Last Updated:** 2026-02-12
**Support:** Contact your system administrator
