/**
 * Tests.gs - Test utilities for the Medical Scheduling System
 * Contains functions to verify all components are working correctly
 */

/**
 * Run all tests
 */
function runAllTests() {
  var logger = Logger.getInstance();
  logger.info('Starting comprehensive test suite');

  var results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Run all test functions
  results = runTest(results, 'testLoggerFunctionality', testLoggerFunctionality);
  results = runTest(results, 'testSheetManagerAppend', testSheetManagerAppend);
  results = runTest(results, 'testSheetManagerQuery', testSheetManagerQuery);
  results = runTest(results, 'testSheetManagerUpdate', testSheetManagerUpdate);
  results = runTest(results, 'testAuthServiceGetUser', testAuthServiceGetUser);
  results = runTest(results, 'testAuthServiceRoles', testAuthServiceRoles);
  results = runTest(results, 'testSheetStructure', testSheetStructure);

  // Display results
  var message = 'Test Results:\n\n';
  message += 'Passed: ' + results.passed + '\n';
  message += 'Failed: ' + results.failed + '\n\n';

  message += 'Details:\n';
  for (var i = 0; i < results.tests.length; i++) {
    var test = results.tests[i];
    message += (test.passed ? '✓' : '✗') + ' ' + test.name + '\n';
    if (!test.passed) {
      message += '  Error: ' + test.error + '\n';
    }
  }

  logger.info('Test suite completed', results);

  SpreadsheetApp.getUi().alert(
    'Test Suite Results',
    message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Helper function to run a test and record results
 */
function runTest(results, testName, testFunction) {
  try {
    testFunction();
    results.passed++;
    results.tests.push({
      name: testName,
      passed: true,
      error: null
    });
  } catch (e) {
    results.failed++;
    results.tests.push({
      name: testName,
      passed: false,
      error: e.toString()
    });
  }
  return results;
}

/**
 * Test Logger functionality
 */
function testLoggerFunctionality() {
  var logger = Logger.getInstance();

  // Test different log levels
  logger.info('Test info message');
  logger.warning('Test warning message');
  logger.error('Test error message', { testKey: 'testValue' });

  // Verify logger exists and has correct methods
  if (!logger.info || !logger.warning || !logger.error || !logger.critical) {
    throw new Error('Logger missing required methods');
  }
}

/**
 * Test SheetManager append functionality
 */
function testSheetManagerAppend() {
  var sheetManager = SheetManager.getInstance();

  // Test appending to Faculty sheet
  var testEmail = 'test.' + Date.now() + '@test.com';
  var rowNumber = sheetManager.appendRow('Faculty', [
    'TEST' + Date.now(),
    'Test User',
    testEmail,
    'Test Department',
    'Test Specialty',
    'Faculty',
    '555-TEST',
    new Date()
  ]);

  if (!rowNumber || rowNumber < 2) {
    throw new Error('Failed to append row or invalid row number');
  }

  // Clean up - delete the test row
  sheetManager.deleteRow('Faculty', rowNumber);
}

/**
 * Test SheetManager query functionality
 */
function testSheetManagerQuery() {
  var sheetManager = SheetManager.getInstance();

  // Get all faculty
  var allFaculty = sheetManager.getAllRows('Faculty');

  if (!Array.isArray(allFaculty)) {
    throw new Error('getAllRows did not return an array');
  }

  // Test findRow
  if (allFaculty.length > 0) {
    var firstFaculty = allFaculty[0];
    var found = sheetManager.findRow('Faculty', {
      Email: firstFaculty.data.Email
    });

    if (!found) {
      throw new Error('findRow failed to find existing record');
    }

    if (found.data.Email !== firstFaculty.data.Email) {
      throw new Error('findRow returned incorrect record');
    }
  }
}

/**
 * Test SheetManager update functionality
 */
function testSheetManagerUpdate() {
  var sheetManager = SheetManager.getInstance();

  // Create a test row
  var testEmail = 'test.' + Date.now() + '@test.com';
  var testId = 'TEST' + Date.now();
  var rowNumber = sheetManager.appendRow('Faculty', [
    testId,
    'Test User',
    testEmail,
    'Test Department',
    'Test Specialty',
    'Faculty',
    '555-TEST',
    new Date()
  ]);

  // Update the name
  sheetManager.updateCell('Faculty', rowNumber, 2, 'Updated Test User');

  // Verify the update
  var found = sheetManager.findRow('Faculty', { FacultyID: testId });

  if (found.data.Name !== 'Updated Test User') {
    throw new Error('Update failed - name not changed');
  }

  // Clean up
  sheetManager.deleteRow('Faculty', rowNumber);
}

/**
 * Test AuthService get user functionality
 */
function testAuthServiceGetUser() {
  var authService = AuthService.getInstance();

  // Get current user email
  var email = authService.getCurrentUserEmail();

  if (!email || email.indexOf('@') === -1) {
    throw new Error('Failed to get valid user email');
  }

  // Get current user (may not be in Faculty sheet)
  var user = authService.getCurrentUser();

  if (!user || !user.email) {
    throw new Error('Failed to get current user object');
  }

  // Verify user object structure
  if (!user.hasOwnProperty('name') || !user.hasOwnProperty('role')) {
    throw new Error('User object missing required properties');
  }
}

/**
 * Test AuthService role functionality
 */
function testAuthServiceRoles() {
  var authService = AuthService.getInstance();

  // Get all faculty
  var faculty = authService.getAllFaculty();

  if (!Array.isArray(faculty)) {
    throw new Error('getAllFaculty did not return an array');
  }

  // Verify role constants exist
  if (!authService.Role.ADMIN || !authService.Role.FACULTY || !authService.Role.UNKNOWN) {
    throw new Error('Role constants not defined correctly');
  }

  // Test role checking methods exist
  if (typeof authService.isAdmin !== 'function' || typeof authService.isFaculty !== 'function') {
    throw new Error('Role checking methods not defined');
  }
}

/**
 * Test sheet structure
 */
function testSheetStructure() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var requiredSheets = ['Faculty', 'Schedule', 'SwapRequests', 'AuditLog'];

  var requiredHeaders = {
    'Faculty': ['FacultyID', 'Name', 'Email', 'Department', 'Specialty', 'Role', 'Phone', 'CreatedDate'],
    'Schedule': ['ScheduleID', 'FacultyID', 'FacultyName', 'Date', 'StartTime', 'EndTime', 'Location', 'Type', 'Status', 'Notes', 'CreatedDate', 'CreatedBy'],
    'SwapRequests': ['RequestID', 'RequestorFacultyID', 'RequestorName', 'TargetFacultyID', 'TargetName', 'OriginalScheduleID', 'RequestedScheduleID', 'Status', 'Reason', 'RequestDate', 'ResponseDate', 'ResponseNotes'],
    'AuditLog': ['Timestamp', 'User', 'Action', 'Details', 'Metadata']
  };

  // Check all required sheets exist
  for (var i = 0; i < requiredSheets.length; i++) {
    var sheetName = requiredSheets[i];
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('Required sheet "' + sheetName + '" not found');
    }

    // Check headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var expectedHeaders = requiredHeaders[sheetName];

    for (var j = 0; j < expectedHeaders.length; j++) {
      if (headers[j] !== expectedHeaders[j]) {
        throw new Error('Sheet "' + sheetName + '" has incorrect header at column ' + (j + 1) + '. Expected "' + expectedHeaders[j] + '", found "' + headers[j] + '"');
      }
    }
  }
}

/**
 * Test OAuth scopes configuration
 */
function testOAuthScopes() {
  var logger = Logger.getInstance();

  // Test that we can access each required service
  try {
    // Test Spreadsheets access
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    logger.info('Spreadsheets access: OK');

    // Test user email access
    var email = Session.getActiveUser().getEmail();
    logger.info('User email access: OK', { email: email });

    // Test UI access
    var ui = SpreadsheetApp.getUi();
    logger.info('UI access: OK');

    SpreadsheetApp.getUi().alert(
      'OAuth Scopes Test',
      'All required OAuth scopes are properly configured and accessible.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (e) {
    logger.error('OAuth scope test failed', { error: e.toString() });
    throw new Error('OAuth scope test failed: ' + e.toString());
  }
}

/**
 * Benchmark SheetManager performance
 */
function benchmarkSheetManager() {
  var logger = Logger.getInstance();
  var sheetManager = SheetManager.getInstance();

  var results = {
    appendTime: 0,
    queryTime: 0,
    updateTime: 0,
    deleteTime: 0
  };

  // Benchmark append
  var startTime = Date.now();
  var testId = 'BENCH' + Date.now();
  var rowNumber = sheetManager.appendRow('Faculty', [
    testId,
    'Benchmark User',
    'bench@test.com',
    'Benchmark Dept',
    'Benchmark Spec',
    'Faculty',
    '555-0000',
    new Date()
  ]);
  results.appendTime = Date.now() - startTime;

  // Benchmark query
  startTime = Date.now();
  var found = sheetManager.findRow('Faculty', { FacultyID: testId });
  results.queryTime = Date.now() - startTime;

  // Benchmark update
  startTime = Date.now();
  sheetManager.updateCell('Faculty', rowNumber, 2, 'Updated Benchmark User');
  results.updateTime = Date.now() - startTime;

  // Benchmark delete
  startTime = Date.now();
  sheetManager.deleteRow('Faculty', rowNumber);
  results.deleteTime = Date.now() - startTime;

  var message = 'SheetManager Performance:\n\n';
  message += 'Append: ' + results.appendTime + 'ms\n';
  message += 'Query: ' + results.queryTime + 'ms\n';
  message += 'Update: ' + results.updateTime + 'ms\n';
  message += 'Delete: ' + results.deleteTime + 'ms\n';

  logger.info('Performance benchmark completed', results);

  SpreadsheetApp.getUi().alert(
    'Performance Benchmark',
    message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
