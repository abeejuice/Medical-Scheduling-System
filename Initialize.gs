/**
 * Initialize.gs - Sets up the Google Sheets structure for the Medical Scheduling System
 * Creates all required sheets with proper headers
 */

/**
 * Initialize the spreadsheet with all required sheets and headers
 * Run this function once after binding the script to a new spreadsheet
 */
function initializeSpreadsheet() {
  var logger = Logger.getInstance();

  try {
    logger.info('Starting spreadsheet initialization');

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create Faculty sheet
    createOrUpdateSheet(ss, 'Faculty', [
      'FacultyID',
      'Name',
      'Email',
      'Department',
      'Specialty',
      'Role',
      'Phone',
      'CreatedDate'
    ]);

    // Create Schedule sheet
    createOrUpdateSheet(ss, 'Schedule', [
      'ScheduleID',
      'FacultyID',
      'FacultyName',
      'Date',
      'StartTime',
      'EndTime',
      'Location',
      'Type',
      'Status',
      'Notes',
      'CreatedDate',
      'CreatedBy'
    ]);

    // Create SwapRequests sheet
    createOrUpdateSheet(ss, 'SwapRequests', [
      'RequestID',
      'RequestorFacultyID',
      'RequestorName',
      'TargetFacultyID',
      'TargetName',
      'OriginalScheduleID',
      'RequestedScheduleID',
      'Status',
      'Reason',
      'RequestDate',
      'ResponseDate',
      'ResponseNotes'
    ]);

    // Create AuditLog sheet
    createOrUpdateSheet(ss, 'AuditLog', [
      'Timestamp',
      'User',
      'Action',
      'Details',
      'Metadata'
    ]);

    logger.info('Spreadsheet initialization completed successfully');

    SpreadsheetApp.getUi().alert(
      'Initialization Complete',
      'All sheets have been created with proper headers.\n\n' +
      'Sheets created:\n' +
      '- Faculty\n' +
      '- Schedule\n' +
      '- SwapRequests\n' +
      '- AuditLog',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (e) {
    logger.critical('Failed to initialize spreadsheet', { error: e.toString() });
    SpreadsheetApp.getUi().alert(
      'Initialization Failed',
      'Error: ' + e.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    throw e;
  }
}

/**
 * Create or update a sheet with headers
 * @param {Spreadsheet} ss - The spreadsheet object
 * @param {string} sheetName - Name of the sheet
 * @param {Array} headers - Array of header names
 */
function createOrUpdateSheet(ss, sheetName, headers) {
  var logger = Logger.getInstance();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    // Create new sheet
    sheet = ss.insertSheet(sheetName);
    logger.info('Created new sheet', { sheetName: sheetName });
  } else {
    logger.info('Sheet already exists, updating headers', { sheetName: sheetName });
  }

  // Set headers
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // Format headers
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');

  // Freeze header row
  sheet.setFrozenRows(1);

  // Auto-resize columns
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  logger.info('Sheet configured successfully', {
    sheetName: sheetName,
    columnCount: headers.length
  });
}

/**
 * Add sample data for testing (optional)
 * Run this after initialization if you want sample data
 */
function addSampleData() {
  var logger = Logger.getInstance();
  var sheetManager = SheetManager.getInstance();

  try {
    logger.info('Adding sample data');

    // Add sample faculty members
    sheetManager.appendRow('Faculty', [
      'FAC001',
      'Dr. John Smith',
      'john.smith@medcollege.edu',
      'Cardiology',
      'Interventional Cardiology',
      'Admin',
      '555-0101',
      new Date()
    ]);

    sheetManager.appendRow('Faculty', [
      'FAC002',
      'Dr. Sarah Johnson',
      'sarah.johnson@medcollege.edu',
      'Neurology',
      'Stroke Care',
      'Faculty',
      '555-0102',
      new Date()
    ]);

    sheetManager.appendRow('Faculty', [
      'FAC003',
      'Dr. Michael Chen',
      'michael.chen@medcollege.edu',
      'Emergency Medicine',
      'Trauma',
      'Faculty',
      '555-0103',
      new Date()
    ]);

    // Add sample schedule entries
    var today = new Date();
    sheetManager.appendRow('Schedule', [
      'SCH001',
      'FAC002',
      'Dr. Sarah Johnson',
      today,
      '09:00',
      '17:00',
      'Building A, Room 301',
      'Clinical Rounds',
      'Confirmed',
      'Regular clinic hours',
      new Date(),
      'john.smith@medcollege.edu'
    ]);

    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    sheetManager.appendRow('Schedule', [
      'SCH002',
      'FAC003',
      'Dr. Michael Chen',
      tomorrow,
      '08:00',
      '16:00',
      'Emergency Department',
      'Emergency Coverage',
      'Confirmed',
      'ED shift',
      new Date(),
      'john.smith@medcollege.edu'
    ]);

    logger.info('Sample data added successfully');

    SpreadsheetApp.getUi().alert(
      'Sample Data Added',
      'Sample faculty and schedule entries have been added.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (e) {
    logger.error('Failed to add sample data', { error: e.toString() });
    SpreadsheetApp.getUi().alert(
      'Failed to Add Sample Data',
      'Error: ' + e.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    throw e;
  }
}

/**
 * Reset the spreadsheet (for development/testing only)
 * WARNING: This will delete all data!
 */
function resetSpreadsheet() {
  var logger = Logger.getInstance();
  var ui = SpreadsheetApp.getUi();

  var response = ui.alert(
    'WARNING: Reset Spreadsheet',
    'This will DELETE ALL DATA and reinitialize the spreadsheet.\n\n' +
    'Are you sure you want to continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    logger.info('Spreadsheet reset cancelled by user');
    return;
  }

  try {
    logger.warning('Starting spreadsheet reset');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();

    // Delete all sheets except the first one
    for (var i = 1; i < sheets.length; i++) {
      ss.deleteSheet(sheets[i]);
    }

    // Clear and rename the first sheet
    var firstSheet = sheets[0];
    firstSheet.clear();
    firstSheet.setName('Faculty');

    // Reinitialize
    initializeSpreadsheet();

    logger.warning('Spreadsheet reset completed');

  } catch (e) {
    logger.critical('Failed to reset spreadsheet', { error: e.toString() });
    ui.alert(
      'Reset Failed',
      'Error: ' + e.toString(),
      ui.ButtonSet.OK
    );
    throw e;
  }
}
