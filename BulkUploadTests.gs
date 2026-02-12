/**
 * BulkUploadTests - Test suite for bulk upload functionality
 * Run these tests to verify the bulk upload feature
 */

/**
 * Run all bulk upload tests
 */
function runBulkUploadTests() {
  var logger = Logger.getInstance();
  var ui = SpreadsheetApp.getUi();

  logger.info('Starting bulk upload tests');

  var results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Run tests
  runTest(results, 'Parser - Tab Delimited Data', testParserTabDelimited);
  runTest(results, 'Parser - Date Parsing Unambiguous', testDateParsingUnambiguous);
  runTest(results, 'Parser - Date Parsing Ambiguous', testDateParsingAmbiguous);
  runTest(results, 'Fuzzy Matcher - Exact Match', testFuzzyMatcherExact);
  runTest(results, 'Fuzzy Matcher - Title Variations', testFuzzyMatcherTitles);
  runTest(results, 'Fuzzy Matcher - Partial Match', testFuzzyMatcherPartial);
  runTest(results, 'Validator - Email Validation', testValidatorEmail);
  runTest(results, 'Validator - Time Validation', testValidatorTime);
  runTest(results, 'Validator - Time Overlap Detection', testValidatorOverlap);
  runTest(results, 'Performance - 100 Row Parse', testPerformance100Rows);

  // Display results
  var message = '=== Bulk Upload Test Results ===\n\n';
  message += 'Passed: ' + results.passed + '\n';
  message += 'Failed: ' + results.failed + '\n\n';

  for (var i = 0; i < results.tests.length; i++) {
    var test = results.tests[i];
    var status = test.passed ? '✓' : '✗';
    message += status + ' ' + test.name;
    if (!test.passed) {
      message += '\n  Error: ' + test.error;
    }
    message += '\n';
  }

  logger.info('Bulk upload tests completed', {
    passed: results.passed,
    failed: results.failed
  });

  ui.alert('Bulk Upload Tests', message, ui.ButtonSet.OK);
}

/**
 * Helper to run a single test
 */
function runTest(results, name, testFn) {
  try {
    testFn();
    results.passed++;
    results.tests.push({ name: name, passed: true });
  } catch (e) {
    results.failed++;
    results.tests.push({ name: name, passed: false, error: e.toString() });
  }
}

/**
 * Test parser with tab-delimited data
 */
function testParserTabDelimited() {
  var parser = BulkUploadParser.getInstance();

  var testData = 'Dr. John Smith\tjohn@test.com\tCardiology\tInterventional\tFaculty\t555-1234';
  var result = parser.parse(testData, 'faculty');

  assertEqual(result.success, true, 'Parse should succeed');
  assertEqual(result.rows.length, 1, 'Should parse 1 row');
  assertEqual(result.rows[0].parsed.name, 'Dr. John Smith', 'Name should match');
  assertEqual(result.rows[0].parsed.email, 'john@test.com', 'Email should match');
}

/**
 * Test date parsing - unambiguous formats
 */
function testDateParsingUnambiguous() {
  var parser = BulkUploadParser.getInstance();

  // ISO format
  var result1 = parser._parseDate('2024-01-15');
  assertEqual(result1.ambiguous, false, 'ISO format should not be ambiguous');
  assertEqual(result1.value, '2024-01-15', 'ISO date should parse correctly');

  // Day > 12, unambiguous
  var result2 = parser._parseDate('15/01/2024');
  assertEqual(result2.ambiguous, false, 'Day > 12 should not be ambiguous');

  // Month name
  var result3 = parser._parseDate('15-Jan-2024');
  assertEqual(result3.ambiguous, false, 'Month name should not be ambiguous');
}

/**
 * Test date parsing - ambiguous formats
 */
function testDateParsingAmbiguous() {
  var parser = BulkUploadParser.getInstance();

  // Ambiguous: 01/02/2024
  var result = parser._parseDate('01/02/2024');
  assertEqual(result.ambiguous, true, 'Should detect ambiguous date');
  assertEqual(result.format, 'AMBIGUOUS', 'Format should be AMBIGUOUS');
  assert(result.possibleInterpretations.length === 2, 'Should have 2 interpretations');
}

/**
 * Test fuzzy matcher - exact match
 */
function testFuzzyMatcherExact() {
  var matcher = FuzzyMatcher.getInstance();

  var facultyList = [
    { data: { Name: 'Dr. John Smith', FacultyID: 'FAC001' } }
  ];

  var result = matcher.matchFaculty('Dr. John Smith', facultyList, 85);

  assertEqual(result.matched, true, 'Should match');
  assertEqual(result.confidence, 100, 'Should be 100% confidence');
  assertEqual(result.matchType, 'exact', 'Should be exact match');
}

/**
 * Test fuzzy matcher - title variations
 */
function testFuzzyMatcherTitles() {
  var matcher = FuzzyMatcher.getInstance();

  var facultyList = [
    { data: { Name: 'Dr. John Smith', FacultyID: 'FAC001' } }
  ];

  // Without title
  var result = matcher.matchFaculty('John Smith', facultyList, 85);
  assertEqual(result.matched, true, 'Should match without title');
  assertEqual(result.confidence, 100, 'Should normalize titles');
}

/**
 * Test fuzzy matcher - partial match
 */
function testFuzzyMatcherPartial() {
  var matcher = FuzzyMatcher.getInstance();

  var facultyList = [
    { data: { Name: 'Dr. John Smith', FacultyID: 'FAC001' } }
  ];

  // Last name only
  var result = matcher.matchFaculty('Smith', facultyList, 70);
  assertEqual(result.matched, true, 'Should match on last name');
  assert(result.confidence >= 70, 'Should meet threshold');
}

/**
 * Test validator - email validation
 */
function testValidatorEmail() {
  var validator = BulkUploadValidator.getInstance();

  assertEqual(validator._isValidEmail('test@example.com'), true, 'Valid email should pass');
  assertEqual(validator._isValidEmail('user.name+tag@domain.co.uk'), true, 'Complex email should pass');
  assertEqual(validator._isValidEmail('invalid'), false, 'Invalid email should fail');
  assertEqual(validator._isValidEmail('missing@domain'), false, 'Missing TLD should fail');
  assertEqual(validator._isValidEmail('@domain.com'), false, 'Missing user should fail');
}

/**
 * Test validator - time validation
 */
function testValidatorTime() {
  var validator = BulkUploadValidator.getInstance();

  assertEqual(validator._isValidTime('09:00'), true, '24-hour format should pass');
  assertEqual(validator._isValidTime('9:00 AM'), true, '12-hour format should pass');
  assertEqual(validator._isValidTime('14:30'), true, 'Afternoon time should pass');
  assertEqual(validator._isValidTime('25:00'), false, 'Invalid hour should fail');
  assertEqual(validator._isValidTime('09:60'), false, 'Invalid minute should fail');
  assertEqual(validator._isValidTime('9:00'), false, 'Missing leading zero should fail');
}

/**
 * Test validator - time overlap detection
 */
function testValidatorOverlap() {
  var validator = BulkUploadValidator.getInstance();

  // Build test schedule index
  var scheduleIndex = {
    'FAC001': {
      '2024-01-15': [
        { startTime: '09:00', endTime: '12:00', scheduleId: 'SCH001' },
        { startTime: '14:00', endTime: '17:00', scheduleId: 'SCH002' }
      ]
    }
  };

  // Test overlap
  var overlaps1 = validator._checkTimeOverlap('FAC001', '2024-01-15', '10:00', '11:00', scheduleIndex);
  assert(overlaps1.length > 0, 'Should detect overlap');

  // Test no overlap
  var overlaps2 = validator._checkTimeOverlap('FAC001', '2024-01-15', '12:30', '13:30', scheduleIndex);
  assertEqual(overlaps2.length, 0, 'Should not detect overlap');

  // Test different faculty
  var overlaps3 = validator._checkTimeOverlap('FAC002', '2024-01-15', '10:00', '11:00', scheduleIndex);
  assertEqual(overlaps3.length, 0, 'Different faculty should not overlap');
}

/**
 * Test performance - 100 row parse
 */
function testPerformance100Rows() {
  var parser = BulkUploadParser.getInstance();

  // Generate 100 rows
  var rows = [];
  for (var i = 0; i < 100; i++) {
    rows.push('Faculty' + i + '\tfac' + i + '@test.com\tDepartment\tSpecialty\tFaculty\t555-' + i);
  }
  var testData = rows.join('\n');

  var startTime = new Date().getTime();
  var result = parser.parse(testData, 'faculty');
  var endTime = new Date().getTime();

  var duration = (endTime - startTime) / 1000;

  assertEqual(result.success, true, 'Parse should succeed');
  assertEqual(result.rows.length, 100, 'Should parse 100 rows');
  assert(duration < 1.0, 'Should parse 100 rows in < 1 second (was ' + duration + 's)');
}

/**
 * Test full faculty upload workflow
 */
function testFacultyUploadWorkflow() {
  var logger = Logger.getInstance();

  try {
    logger.info('Testing faculty upload workflow');

    // Test data
    var testData = 'Test User\ttest_bulk@example.com\tTest Dept\tTest Spec\tFaculty\t555-0000';

    // Process upload
    var result = processFacultyUpload(testData);

    assertEqual(result.success, true, 'Processing should succeed');
    assertEqual(result.totalRows, 1, 'Should have 1 row');
    assertEqual(result.validCount, 1, 'Should have 1 valid row');

    logger.info('Faculty upload workflow test passed');

  } catch (e) {
    logger.error('Faculty upload workflow test failed', { error: e.toString() });
    throw e;
  }
}

/**
 * Test full events upload workflow
 */
function testEventsUploadWorkflow() {
  var logger = Logger.getInstance();
  var sheetManager = SheetManager.getInstance();

  try {
    logger.info('Testing events upload workflow');

    // Ensure we have a test faculty
    var existingFaculty = sheetManager.getAllRows('Faculty');
    if (existingFaculty.length === 0) {
      throw new Error('No faculty found - run addSampleData() first');
    }

    var testFacultyName = existingFaculty[0].data.Name;

    // Test data
    var testData = testFacultyName + '\t2024-12-25\t09:00\t17:00\tTest Location\tClinic\tTest notes';

    // Process upload
    var result = processEventsUpload(testData);

    assertEqual(result.success, true, 'Processing should succeed');
    assertEqual(result.totalRows, 1, 'Should have 1 row');

    logger.info('Events upload workflow test passed', {
      valid: result.validCount,
      invalid: result.invalidCount
    });

  } catch (e) {
    logger.error('Events upload workflow test failed', { error: e.toString() });
    throw e;
  }
}

/**
 * Assert helper
 */
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error((message || 'Assertion failed') + ': expected ' + expected + ', got ' + actual);
  }
}

/**
 * Assert helper for boolean
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Demo bulk upload with sample data
 */
function demoBulkUpload() {
  var logger = Logger.getInstance();
  var ui = SpreadsheetApp.getUi();

  logger.info('Running bulk upload demo');

  var facultyData =
    'Dr. Alice Johnson\talice.j@hospital.edu\tCardiology\tInterventional\tFaculty\t555-1001\n' +
    'Dr. Bob Williams\tbob.w@hospital.edu\tNeurology\tPediatric\tFaculty\t555-1002\n' +
    'Dr. Carol Davis\tcarol.d@hospital.edu\tEmergency\tTrauma\tAdmin\t555-1003';

  ui.alert(
    'Bulk Upload Demo',
    'This will demonstrate parsing 3 faculty members.\n\n' +
    'Sample data:\n' +
    facultyData.substring(0, 100) + '...\n\n' +
    'Click OK to process.',
    ui.ButtonSet.OK
  );

  var result = processFacultyUpload(facultyData);

  var message = 'Demo Results:\n\n';
  message += 'Total Rows: ' + result.totalRows + '\n';
  message += 'Valid Rows: ' + result.validCount + '\n';
  message += 'Invalid Rows: ' + result.invalidCount + '\n';
  message += 'Processing Time: ' + result.processingTime.toFixed(2) + 's\n';

  ui.alert('Demo Complete', message, ui.ButtonSet.OK);

  logger.info('Bulk upload demo completed', {
    totalRows: result.totalRows,
    validCount: result.validCount,
    processingTime: result.processingTime
  });
}
