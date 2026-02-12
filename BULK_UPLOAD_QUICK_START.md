# Bulk Upload - Quick Start Guide

## 🚀 5-Minute Quick Start

### Step 1: Open Bulk Upload (10 seconds)
1. Open your Medical Scheduling spreadsheet
2. Click **Medical Scheduling** menu
3. Click **📋 Bulk Upload...**

### Step 2: Select Data Type (5 seconds)
- Click **👥 Faculty Members** to upload faculty
- OR click **📅 Events/Schedules** to upload events

### Step 3: Paste Your Data (30 seconds)
**Faculty Example:**
```
Email                    Name            Role     Department    ContactNumber  Status
john@med.edu            Dr. John Smith  Faculty  Cardiology    555-0100      Active
jane@med.edu            Dr. Jane Doe    Admin    Surgery       555-0101      Active
```

**Events Example:**
```
FacultyEmail            EventType  StartDateTime        EndDateTime          Location  Description
john@med.edu           Clinic     2024-02-15 09:00    2024-02-15 12:00     Room 101  Morning Clinic
jane@med.edu           Surgery    2024-02-15 14:00    2024-02-15 17:00     OR 3      Surgery
```

### Step 4: Parse & Preview (< 2 seconds)
1. Click **🔍 Parse & Preview**
2. Wait for validation (< 2 seconds)
3. Review results:
   - **Green rows** = Valid ✅
   - **Red rows** = Invalid ❌
   - **Yellow rows** = Warning ⚠️

### Step 5: Review Validation (1-2 minutes)
- Check summary: "Valid: X, Invalid: Y"
- Read error messages for invalid rows
- Fix data if needed (click "Back to Edit")

### Step 6: Commit Data (5-10 seconds)
1. Click **✅ Commit Valid Rows**
2. Confirm upload
3. See result: "Successful: X, Failed: Y"

**Total Time: 2-5 minutes for 50+ rows!**

---

## 📋 Data Format Templates

### Faculty Template (Tab-delimited)
```
Email	Name	Role	Department	ContactNumber	Status
user@example.com	Dr. Full Name	Faculty	Department Name	555-0000	Active
```

**Required Columns**:
- Email (must be unique, valid format)
- Name
- Role (must be "Admin" or "Faculty")

**Optional Columns**:
- Department
- ContactNumber
- Status (defaults to "Active")

### Events Template (Tab-delimited)
```
FacultyEmail	EventType	StartDateTime	EndDateTime	Location	Description
user@example.com	Clinic	2024-02-15 09:00	2024-02-15 12:00	Room 101	Description
```

**Required Columns**:
- FacultyEmail OR FacultyName
- EventType
- StartDateTime (use ISO format: YYYY-MM-DD HH:MM)
- EndDateTime

**Optional Columns**:
- Location
- Description

---

## ✅ Best Practices

### 1. Date Format (Avoid Ambiguity)
✅ **Use**: `2024-02-15 09:00` (ISO format)
❌ **Avoid**: `01/02/2024` (ambiguous - could be Jan 2 or Feb 1)

### 2. Faculty Reference
✅ **Best**: Use exact email (`john@med.edu`)
✅ **Good**: Use full name (`Dr. John Smith` - fuzzy match 85%+)
❌ **Risky**: Use partial name (`John` - may find multiple matches)

### 3. Copy from Excel/Word
1. Ensure first row is headers
2. Select entire table (including headers)
3. Copy (Ctrl+C / Cmd+C)
4. Paste into bulk upload text area (Ctrl+V / Cmd+V)

### 4. Start Small
- Test with 5-10 rows first
- Verify format and validation
- Then upload full dataset (50+, 100+)

### 5. Fix Errors Efficiently
- Note row numbers with errors
- Click "Back to Edit"
- Fix in text area
- Re-parse and commit

---

## 🚨 Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid email format" | Email not valid | Use format: user@domain.com |
| "Email already exists" | Duplicate faculty | Check Faculty sheet, use unique emails |
| "Faculty email not found" | Event references missing faculty | Add faculty first, or fix email |
| "No matching faculty found" | Name doesn't match | Use exact email instead of name |
| "Ambiguous date format" | Date could be MM/DD or DD/MM | Use ISO format: 2024-02-15 |
| "Invalid date format" | Date not recognized | Use: YYYY-MM-DD or Month DD, YYYY |
| "End time must be after start" | Times in wrong order | Swap start/end times |
| "Time overlap" | Event conflicts with existing | Check Schedule sheet, adjust times |

---

## 🎯 Performance Expectations

| Action | Rows | Expected Time |
|--------|------|---------------|
| Parse & Preview | 10 | < 0.5 seconds |
| Parse & Preview | 50 | < 1 second |
| Parse & Preview | 100 | < 2 seconds |
| Commit | 50 | 2-3 seconds |
| Commit | 100 | 4-5 seconds |

---

## 🔧 Troubleshooting

### Issue: Dialog won't open
**Solution**: Check you're logged in and have permissions

### Issue: "No data provided"
**Solution**: Make sure you pasted data into the text area

### Issue: "Need at least header row and one data row"
**Solution**: Ensure first row is headers, second row onwards is data

### Issue: All rows show invalid
**Solution**: Check column headers match expected format exactly

### Issue: Commit button disabled
**Solution**: No valid rows found - fix validation errors first

### Issue: "Only administrators can perform bulk uploads"
**Solution**: You need Admin role in Faculty sheet

---

## 📞 Quick Help

### Get Templates
Click **"View templates"** link in the upload dialog

### Test System
Menu: **Medical Scheduling → Test Bulk Upload**

### View Logs
Check **AuditLog** sheet for upload history

### Full Documentation
- **User Guide**: BULK_UPLOAD_GUIDE.md
- **Technical Docs**: BULK_UPLOAD_IMPLEMENTATION.md
- **Verification**: ACCEPTANCE_CRITERIA_VERIFICATION.md

---

## 💡 Pro Tips

1. **Use Excel for Data Prep**
   - Organize data with proper headers
   - Format dates as YYYY-MM-DD
   - Validate before pasting

2. **Batch by Type**
   - Upload all faculty first
   - Then upload events (references faculty)

3. **Review Warnings**
   - Yellow rows can be committed
   - But review warnings to ensure correctness

4. **Save Your Source**
   - Keep Excel file with original data
   - Useful for fixing errors and re-upload

5. **Check Results**
   - After upload, verify in Faculty/Schedule sheets
   - Review AuditLog for any issues

---

**Need more help?** See BULK_UPLOAD_GUIDE.md for detailed instructions.
