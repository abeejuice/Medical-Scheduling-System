/**
 * Setup and initialization functions for the Medical Scheduling System
 * Run initializeWorkbook() once to set up the Google Sheets structure
 */

/**
 * Initialize the workbook with required sheets and headers
 * This function should be run once when setting up the system
 */
function initializeWorkbook() {
  try {
    Logger.info('Starting workbook initialization');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('No active spreadsheet found. Please create or open a spreadsheet first.');
    }

    var config = SheetManager.getInstance().getSheetConfig();
    var createdSheets = [];
    var existingSheets = [];

    // Create sheets if they don't exist
    for (var sheetName in config) {
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        // Create new sheet
        sheet = ss.insertSheet(sheetName);

        // Set headers
        var headers = config[sheetName].headers;
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

        // Format header row
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#4285F4');
        headerRange.setFontColor('#FFFFFF');

        // Auto-resize columns
        for (var i = 1; i <= headers.length; i++) {
          sheet.autoResizeColumn(i);
        }

        // Freeze header row
        sheet.setFrozenRows(1);

        createdSheets.push(sheetName);
        Logger.info('Created sheet: ' + sheetName);
      } else {
        existingSheets.push(sheetName);
        Logger.info('Sheet already exists: ' + sheetName);

        // Verify headers match
        var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var expectedHeaders = config[sheetName].headers;
        var headersMatch = true;

        if (existingHeaders.length !== expectedHeaders.length) {
          headersMatch = false;
        } else {
          for (var i = 0; i < expectedHeaders.length; i++) {
            if (existingHeaders[i] !== expectedHeaders[i]) {
              headersMatch = false;
              break;
            }
          }
        }

        if (!headersMatch) {
          Logger.warning('Headers mismatch in sheet: ' + sheetName, {
            expected: expectedHeaders.join(', '),
            found: existingHeaders.join(', ')
          });
        }
      }
    }

    // Remove default "Sheet1" if it exists and is empty
    var defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && defaultSheet.getLastRow() <= 1 && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
      Logger.info('Removed default Sheet1');
    }

    var message = 'Workbook initialization complete!\n\n';

    if (createdSheets.length > 0) {
      message += 'Created sheets: ' + createdSheets.join(', ') + '\n';
    }

    if (existingSheets.length > 0) {
      message += 'Existing sheets: ' + existingSheets.join(', ') + '\n';
    }

    message += '\nAll required sheets are now available with proper headers.';

    Logger.info('Workbook initialization successful', {
      createdSheets: createdSheets,
      existingSheets: existingSheets
    });

    SpreadsheetApp.getUi().alert('Success', message, SpreadsheetApp.getUi().ButtonSet.OK);

    return {
      success: true,
      createdSheets: createdSheets,
      existingSheets: existingSheets
    };

  } catch (e) {
    Logger.critical('Workbook initialization failed', { error: e.toString() });
    SpreadsheetApp.getUi().alert('Error', 'Initialization failed: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    throw e;
  }
}

/**
 * Add sample data for testing (optional)
 * This can be run after initializeWorkbook() to populate with test data
 */
function addSampleData() {
  try {
    Logger.info('Adding sample data');

    var sheetManager = SheetManager.getInstance();

    // Add sample faculty
    var sampleFaculty = [
      ['admin@medical.edu', 'Dr. Admin User', 'Admin', 'Administration', '555-0001', 'Active'],
      ['john.doe@medical.edu', 'Dr. John Doe', 'Faculty', 'Cardiology', '555-0002', 'Active'],
      ['jane.smith@medical.edu', 'Dr. Jane Smith', 'Faculty', 'Neurology', '555-0003', 'Active'],
      ['bob.wilson@medical.edu', 'Dr. Bob Wilson', 'Faculty', 'Orthopedics', '555-0004', 'Active']
    ];

    for (var i = 0; i < sampleFaculty.length; i++) {
      sheetManager.appendRow('Faculty', sampleFaculty[i]);
    }

    Logger.info('Sample data added successfully');
    SpreadsheetApp.getUi().alert('Success', 'Sample data has been added to the Faculty sheet.', SpreadsheetApp.getUi().ButtonSet.OK);

    return { success: true, facultyAdded: sampleFaculty.length };

  } catch (e) {
    Logger.error('Failed to add sample data', { error: e.toString() });
    SpreadsheetApp.getUi().alert('Error', 'Failed to add sample data: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    throw e;
  }
}

/**
 * Create custom menu for easy access to setup functions
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Medical Scheduling')
      .addItem('Initialize Workbook', 'initializeWorkbook')
      .addItem('Add Sample Data', 'addSampleData')
      .addSeparator()
      .addItem('📋 Bulk Upload...', 'showBulkUploadDialog')
      .addSeparator()
      .addItem('Test SheetManager', 'testSheetManager')
      .addItem('Test AuthService', 'testAuthService')
      .addItem('Test Bulk Upload', 'testBulkUploadService')
      .addToUi();

    Logger.info('Custom menu created');
  } catch (e) {
    Logger.error('Failed to create custom menu', { error: e.toString() });
  }
}

/**
 * Test SheetManager functionality
 */
function testSheetManager() {
  try {
    Logger.info('Testing SheetManager');

    var sheetManager = SheetManager.getInstance();
    var results = [];

    // Test append
    var testRow = ['test@example.com', 'Test User', 'Faculty', 'Test Dept', '555-9999', 'Active'];
    var rowNum = sheetManager.appendRow('Faculty', testRow);
    results.push('✓ Append test passed (row ' + rowNum + ')');

    // Test query
    var rows = sheetManager.queryRows('Faculty', function(row) {
      return row.Email === 'test@example.com';
    });
    if (rows.length > 0) {
      results.push('✓ Query test passed (found ' + rows.length + ' row(s))');
    } else {
      results.push('✗ Query test failed');
    }

    // Test update
    sheetManager.updateRowByCriteria('Faculty',
      { Email: 'test@example.com' },
      { Status: 'Inactive' }
    );
    results.push('✓ Update test passed');

    // Test find
    var foundRow = sheetManager.findRow('Faculty', { Email: 'test@example.com' });
    if (foundRow && foundRow.Status === 'Inactive') {
      results.push('✓ Find test passed');
    } else {
      results.push('✗ Find test failed');
    }

    Logger.info('SheetManager tests completed', { results: results });
    SpreadsheetApp.getUi().alert('SheetManager Tests', results.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (e) {
    Logger.error('SheetManager test failed', { error: e.toString() });
    SpreadsheetApp.getUi().alert('Error', 'Test failed: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Test AuthService functionality
 */
function testAuthService() {
  try {
    Logger.info('Testing AuthService');

    var authService = AuthService.getInstance();
    var results = [];

    // Test get current user email
    var email = authService.getCurrentUserEmail();
    results.push('Current user email: ' + (email || 'Not available'));

    // Test get current user
    var user = authService.getCurrentUser();
    if (user) {
      results.push('✓ User found: ' + user.Name);
      results.push('  Role: ' + user.Role);
      results.push('  Department: ' + user.Department);
    } else {
      results.push('✗ User not found in Faculty sheet');
    }

    // Test get role
    var role = authService.getCurrentUserRole();
    results.push('Current role: ' + role);

    // Test role checks
    results.push('Is Admin: ' + authService.isAdmin());
    results.push('Is Faculty: ' + authService.isFaculty());

    Logger.info('AuthService tests completed', { results: results });
    SpreadsheetApp.getUi().alert('AuthService Tests', results.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (e) {
    Logger.error('AuthService test failed', { error: e.toString() });
    SpreadsheetApp.getUi().alert('Error', 'Test failed: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Show the bulk upload dialog
 */
function showBulkUploadDialog() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('BulkUploadUI')
      .setWidth(1000)
      .setHeight(700)
      .setTitle('Bulk Upload');

    SpreadsheetApp.getUi().showModalDialog(html, 'Bulk Upload - Faculty & Events');

    Logger.info('Bulk upload dialog opened');
  } catch (e) {
    Logger.error('Failed to show bulk upload dialog', { error: e.toString() });
    SpreadsheetApp.getUi().alert('Error', 'Failed to open bulk upload: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Server-side function to preview bulk upload data
 * Called from BulkUploadUI.html
 * @param {string} rawData - Pasted table data
 * @param {string} dataType - 'faculty' or 'events'
 * @return {Object} Preview result
 */
function previewBulkData(rawData, dataType) {
  try {
    var bulkUploadService = BulkUploadService.getInstance();
    return bulkUploadService.previewBulkUpload(rawData, dataType);
  } catch (e) {
    Logger.error('Failed to preview bulk data', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Server-side function to commit bulk upload data
 * Called from BulkUploadUI.html
 * @param {Array} validatedRows - Array of validated row objects
 * @param {string} dataType - 'faculty' or 'events'
 * @return {Object} Commit result
 */
function commitBulkData(validatedRows, dataType) {
  try {
    // Check authorization - only admins can bulk upload
    var authService = AuthService.getInstance();
    if (!authService.isAdmin()) {
      Logger.warning('Unauthorized bulk upload attempt', {
        user: authService.getCurrentUserEmail()
      });
      return {
        success: false,
        error: 'Only administrators can perform bulk uploads'
      };
    }

    var bulkUploadService = BulkUploadService.getInstance();
    return bulkUploadService.commitBulkUpload(validatedRows, dataType);
  } catch (e) {
    Logger.error('Failed to commit bulk data', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Test BulkUploadService functionality
 */
function testBulkUploadService() {
  try {
    Logger.info('Testing BulkUploadService');

    var bulkService = BulkUploadService.getInstance();
    var results = [];

    // Test 1: Parse table data
    var testData = 'Email\tName\tRole\tDepartment\n' +
                   'test1@example.com\tDr. Test One\tFaculty\tCardiology\n' +
                   'test2@example.com\tDr. Test Two\tAdmin\tSurgery';
    var parsed = bulkService.parseTableData(testData);
    if (parsed.headers.length === 4 && parsed.rows.length === 2) {
      results.push('✓ Parse test passed (4 headers, 2 rows)');
    } else {
      results.push('✗ Parse test failed');
    }

    // Test 2: Date parsing - unambiguous
    var dateResult1 = bulkService.parseDate('2024-02-15');
    if (dateResult1.date && !dateResult1.isAmbiguous) {
      results.push('✓ Unambiguous date test passed');
    } else {
      results.push('✗ Unambiguous date test failed');
    }

    // Test 3: Date parsing - ambiguous
    var dateResult2 = bulkService.parseDate('01/02/2024');
    if (dateResult2.date && dateResult2.isAmbiguous) {
      results.push('✓ Ambiguous date test passed (flagged as ambiguous)');
    } else {
      results.push('✗ Ambiguous date test failed');
    }

    // Test 4: Similarity calculation
    var similarity = bulkService.calculateSimilarity('Dr. John Smith', 'John Smith');
    if (similarity >= 85) {
      results.push('✓ Similarity test passed (' + similarity + '%)');
    } else {
      results.push('✗ Similarity test failed (' + similarity + '%)');
    }

    // Test 5: Fuzzy matching (if faculty exists)
    var allFaculty = SheetManager.getInstance().queryRows('Faculty');
    if (allFaculty.length > 0) {
      var matches = bulkService.findMatchingFaculty('Dr. ' + allFaculty[0].Name);
      if (matches.length > 0 && matches[0].confidence >= 85) {
        results.push('✓ Fuzzy match test passed (confidence: ' + matches[0].confidence + '%)');
      } else {
        results.push('⚠ Fuzzy match test - no high confidence match');
      }
    } else {
      results.push('⚠ Fuzzy match test skipped (no faculty in database)');
    }

    Logger.info('BulkUploadService tests completed', { results: results });
    SpreadsheetApp.getUi().alert('BulkUploadService Tests', results.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (e) {
    Logger.error('BulkUploadService test failed', { error: e.toString() });
    SpreadsheetApp.getUi().alert('Error', 'Test failed: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
