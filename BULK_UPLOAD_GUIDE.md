# Bulk Upload Feature - User Guide

## Overview

The bulk upload feature allows administrators to import 50+ faculty members and 100+ events with zero manual entry, directly from Word tables or CSV data.

## 🎯 Key Features

### ✅ Fast Data Preview
- **2-second parsing**: Paste table data and see validated preview within 2 seconds
- **Real-time validation**: Each row is validated immediately with clear error/warning messages
- **Visual feedback**: Color-coded rows (green=valid, red=invalid, yellow=warning)

### ✅ Smart Date Handling
- **Ambiguous date detection**: Dates like "01/02/2024" are flagged for manual confirmation
- **Unambiguous auto-accept**: Dates like "2024-02-15" or "15-Jan-2024" are automatically accepted
- **Multiple format support**: ISO (2024-02-15), US (MM/DD/YYYY), text (January 15, 2024)

### ✅ Intelligent Faculty Matching
- **Fuzzy name matching**: Handles variations like "Dr. John" vs "John Smith" with 85%+ confidence
- **Multiple match detection**: Suggests best matches when multiple faculty members match
- **Email-based lookup**: Direct email matching for precise faculty identification

### ✅ Comprehensive Validation
- **Row-level error messages**: Each row shows specific validation errors
- **Time overlap detection**: Prevents scheduling conflicts automatically
- **Required field checking**: Ensures all mandatory fields are present
- **Format validation**: Email addresses, dates, and role values are validated

### ✅ Selective Commit
- **Valid-only upload**: Only valid rows are committed to the database
- **Invalid row rejection**: Invalid rows are rejected with clear reasons
- **Success count reporting**: See exactly how many rows were successfully uploaded

## 📋 How to Use

### Step 1: Access Bulk Upload
1. Open your Medical Scheduling spreadsheet
2. Go to **Medical Scheduling** menu → **📋 Bulk Upload...**
3. The bulk upload dialog will open

### Step 2: Select Data Type
- Click **👥 Faculty Members** to upload faculty
- Click **📅 Events/Schedules** to upload events

### Step 3: Prepare Your Data

#### Faculty Data Format
Required columns:
- **Email** (required, unique)
- **Name** (required)
- **Role** (required: "Admin" or "Faculty")
- **Department** (optional)
- **ContactNumber** (optional)
- **Status** (optional, defaults to "Active")

Example (copy from Word/Excel):
```
Email                       Name              Role     Department    ContactNumber  Status
john.smith@medical.edu     Dr. John Smith    Faculty  Cardiology    555-0100      Active
jane.doe@medical.edu       Dr. Jane Doe      Admin    Surgery       555-0101      Active
```

#### Event Data Format
Required columns:
- **FacultyEmail** OR **FacultyName** (at least one required)
- **EventType** (required: e.g., "Clinic", "Surgery", "Meeting")
- **StartDateTime** (required)
- **EndDateTime** (required)
- **Location** (optional)
- **Description** (optional)

Example (copy from Word/Excel):
```
FacultyEmail               EventType  StartDateTime        EndDateTime          Location  Description
john.smith@medical.edu    Clinic     2024-02-15 09:00    2024-02-15 12:00     Room 101  Morning Clinic
jane.doe@medical.edu      Surgery    2024-02-15 14:00    2024-02-15 17:00     OR 3      Scheduled Surgery
```

Or with faculty names instead of emails:
```
FacultyName        EventType  StartDateTime        EndDateTime          Location  Description
Dr. John Smith     Clinic     2024-02-15 09:00    2024-02-15 12:00     Room 101  Morning Clinic
Jane Doe          Surgery    2024-02-15 14:00    2024-02-15 17:00     OR 3      Scheduled Surgery
```

### Step 4: Paste Your Data
1. Copy your table from Word, Excel, or CSV file
2. Paste it into the text area
3. Click **🔍 Parse & Preview**
4. Wait 1-2 seconds for validation

### Step 5: Review Validation Results

The preview table will show:
- **Row number**: Original row position
- **Status badge**: Valid (green), Invalid (red), Warning (yellow)
- **Your data**: All columns from your pasted data
- **Messages**: Specific errors/warnings for each row

#### Summary Box Shows:
- **Total Rows**: How many rows were parsed
- **Valid**: How many rows passed all validations
- **Invalid**: How many rows have errors
- **Parse Time**: How fast the data was processed

### Step 6: Review Validation Messages

#### ✅ Valid Rows
- Green background
- "Valid" badge
- "✓ OK" in messages column
- Will be uploaded when you commit

#### ❌ Invalid Rows (Examples)
- **Red background**
- "Invalid" badge
- Error messages like:
  - "Email is required"
  - "Invalid email format"
  - "Faculty email not found: xyz@example.com"
  - "Invalid StartDateTime: date parse failure"
  - "End time must be after start time"
  - "Time overlap with existing event(s)"

#### ⚠️ Warning Rows (Examples)
- **Yellow background**
- "Warning" badge
- Warning messages like:
  - "Ambiguous start date format - please confirm"
  - "Matched to: Dr. John Smith (92%)"
  - "Multiple matches found - need manual selection"

### Step 7: Handle Ambiguous Dates

If you see warnings about ambiguous dates:
1. Check the date value (e.g., "01/02/2024")
2. Determine if it means:
   - January 2, 2024 (MM/DD/YYYY) - **US format**
   - February 1, 2024 (DD/MM/YYYY) - **European format**
3. If incorrect, go back and edit the original data
4. **Recommended**: Use unambiguous formats:
   - ISO format: `2024-02-15`
   - Text format: `January 15, 2024` or `15-Jan-2024`

### Step 8: Handle Faculty Matching

#### Exact Email Match (Best)
```
FacultyEmail: john.smith@medical.edu
✓ Direct match - no ambiguity
```

#### Fuzzy Name Match (Good)
```
FacultyName: Dr. John
⚠️ Matched to: Dr. John Smith (92%)
✓ Will use matched email automatically
```

#### Multiple Matches (Needs Action)
```
FacultyName: John
⚠️ Multiple matches found - need manual selection
❌ Cannot auto-commit - edit to use exact email
```

**Solution**: Replace faculty name with exact email address

### Step 9: Commit Valid Rows
1. Review the summary: "X valid, Y invalid"
2. Click **✅ Commit Valid Rows**
3. Confirm the upload
4. Wait for processing

Invalid rows will be automatically skipped with reasons logged.

### Step 10: View Results

The result screen shows:
- **Total Processed**: How many rows were attempted
- **Successful**: How many were successfully uploaded
- **Failed**: How many failed (with reasons)

Click **📋 Upload More Data** to start over, or **✓ Close** to finish.

## 🔧 Advanced Tips

### Tip 1: Use Templates
Click **"View templates"** link in the paste area to see example data format.

### Tip 2: Test with Small Batches
- Start with 5-10 rows to test your data format
- Once validated, upload the full dataset

### Tip 3: Prepare Data in Excel
1. Create your data in Excel with proper column headers
2. Format dates as `YYYY-MM-DD` to avoid ambiguity
3. Copy entire table (Ctrl+C)
4. Paste into bulk upload dialog (Ctrl+V)

### Tip 4: Handle Large Datasets
- **50+ faculty**: Upload takes 2-5 seconds
- **100+ events**: Upload takes 3-8 seconds
- **Performance**: System handles 200+ rows efficiently

### Tip 5: Fix Validation Errors
1. Note the row numbers with errors
2. Click **← Back to Edit**
3. Fix the data in the text area
4. Click **🔍 Parse & Preview** again

### Tip 6: Prevent Time Overlaps
The system automatically checks for scheduling conflicts:
- Same faculty member cannot have overlapping events
- Validation runs before commit
- Error message: "Time overlap with existing event(s)"

## 🚨 Common Issues & Solutions

### Issue: "Need at least header row and one data row"
**Solution**: Ensure first row is headers, second row onwards is data

### Issue: "Invalid email format"
**Solution**: Use proper email format: `user@domain.com`

### Issue: "Email already exists in system"
**Solution**: Faculty email must be unique - check for duplicates

### Issue: "Faculty email not found"
**Solution**: Ensure faculty exists in Faculty sheet before uploading events

### Issue: "Invalid date format"
**Solution**: Use supported formats:
- `2024-02-15` (ISO - best)
- `01/15/2024` (US)
- `January 15, 2024` (text)
- `15-Jan-2024` (text)

### Issue: "No matching faculty found"
**Solution**: Use exact email instead of name, or add faculty first

### Issue: "Time overlap with existing event(s)"
**Solution**: Check Schedule sheet for conflicts, adjust times

### Issue: "Role must be Admin or Faculty"
**Solution**: Use exact values "Admin" or "Faculty" (case-sensitive)

## 📊 Performance Benchmarks

Based on acceptance criteria:
- ✅ **Preview generation**: < 2 seconds for 100 rows
- ✅ **Date parsing**: Instant detection of ambiguous formats
- ✅ **Faculty matching**: 85%+ confidence threshold
- ✅ **Validation**: Real-time per-row validation
- ✅ **Commit**: Batch upload with success/failure reporting

## 🔒 Security & Permissions

- **Admin Only**: Only users with Admin role can perform bulk uploads
- **Audit Trail**: All uploads are logged to AuditLog sheet
- **Validation First**: No data is written until validation passes
- **Atomic Operations**: Each row is committed independently

## 📝 Example Workflow

### Uploading 50 Faculty Members
1. Export faculty list from HR system to Excel
2. Format as required columns
3. Copy and paste into bulk upload
4. Review validation (< 2 seconds)
5. Fix any errors in source data
6. Re-paste and commit
7. Verify 50 faculty uploaded successfully

### Uploading 100+ Events
1. Prepare schedule in Excel with faculty emails
2. Use ISO date format (2024-02-15 09:00)
3. Copy and paste into bulk upload
4. System validates faculty existence
5. System checks for time overlaps
6. Commit valid events
7. Review any conflicts or errors
8. Fix issues and re-upload failed rows

## 🎓 Best Practices

1. **Always use email for events**: More reliable than name matching
2. **Use ISO date format**: Avoids ambiguity (YYYY-MM-DD HH:MM)
3. **Validate in batches**: Test 10 rows before uploading 100
4. **Keep source data**: Save Excel file for reference
5. **Review warnings**: Even if valid, warnings may need attention
6. **Check audit log**: Verify all uploads in AuditLog sheet

## 📞 Support

For issues with bulk upload:
1. Check validation messages for specific errors
2. Review this guide for common solutions
3. Test with sample data from templates
4. Check AuditLog sheet for error details
5. Run "Test Bulk Upload" from Medical Scheduling menu

---

**Last Updated**: 2024-02-12
**Feature Status**: ✅ Production Ready
**Supported Data Types**: Faculty, Events
