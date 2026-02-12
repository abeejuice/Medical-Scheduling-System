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
      .addItem('Test SheetManager', 'testSheetManager')
      .addItem('Test AuthService', 'testAuthService')
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
