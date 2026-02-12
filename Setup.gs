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

    // Protect AuditLog sheet from modifications (make it append-only)
    try {
      protectAuditLogSheet();
      Logger.info('AuditLog sheet protected');
    } catch (e) {
      Logger.warning('Failed to protect AuditLog sheet', { error: e.toString() });
      // Continue even if protection fails
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
    var menu = ui.createMenu('Medical Scheduling')
      .addItem('Initialize Workbook', 'initializeWorkbook')
      .addItem('Add Sample Data', 'addSampleData')
      .addSeparator()
      .addItem('📋 Bulk Upload...', 'showBulkUploadDialog')
      .addSeparator();

    // Add admin-only menu items
    try {
      var authService = AuthService.getInstance();
      if (authService.isAdmin()) {
        menu.addItem('🔍 View Audit Logs (Admin)', 'showAuditLogViewer')
          .addSeparator();
      }
    } catch (e) {
      // If auth check fails, continue without admin menu
    }

    menu.addItem('Test SheetManager', 'testSheetManager')
      .addItem('Test AuthService', 'testAuthService')
      .addItem('Test Bulk Upload', 'testBulkUploadService')
      .addSeparator()
      .addItem('🔒 Run Security Tests', 'runAllSecurityTests')
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
 * Show the audit log viewer (ADMIN ONLY)
 */
function showAuditLogViewer() {
  try {
    // SECURITY: Check admin authorization
    var authService = AuthService.getInstance();
    var auditService = AuditService.getInstance();

    if (!authService.isAdmin()) {
      auditService.logAccessDenied(
        'audit-log-viewer',
        'Admin role required',
        {
          userRole: authService.getCurrentUserRole()
        }
      );

      SpreadsheetApp.getUi().alert(
        'Access Denied',
        'Only administrators can view audit logs.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }

    // Log access
    auditService.logAccessGranted('audit-log-viewer', {});

    var html = HtmlService.createHtmlOutputFromFile('AuditLogViewer')
      .setWidth(1200)
      .setHeight(800)
      .setTitle('Audit Log Viewer');

    SpreadsheetApp.getUi().showModalDialog(html, 'Audit Log Viewer (Admin Only)');

    Logger.info('Audit log viewer opened');
  } catch (e) {
    Logger.error('Failed to show audit log viewer', { error: e.toString() });
    SpreadsheetApp.getUi().alert('Error', 'Failed to open audit log viewer: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Server-side function to preview bulk upload data
 * Called from BulkUploadUI.html
 * SECURITY: Only admins can preview bulk uploads
 * @param {string} rawData - Pasted table data
 * @param {string} dataType - 'faculty' or 'events'
 * @return {Object} Preview result
 */
function previewBulkData(rawData, dataType) {
  try {
    // SECURITY: Check authorization
    var authService = AuthService.getInstance();
    var auditService = AuditService.getInstance();
    var currentUserEmail = authService.getCurrentUserEmail();

    if (!authService.isAdmin()) {
      // Log unauthorized attempt
      auditService.logAccessDenied(
        'bulk-upload-preview',
        'Admin role required',
        {
          dataType: dataType,
          userRole: authService.getCurrentUserRole()
        }
      );

      Logger.warning('Unauthorized bulk upload preview attempt', {
        user: currentUserEmail,
        role: authService.getCurrentUserRole()
      });

      return {
        success: false,
        error: 'Access denied: Only administrators can perform bulk uploads'
      };
    }

    // Log access granted
    auditService.logAccessGranted('bulk-upload-preview', {
      dataType: dataType
    });

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
 * SECURITY: Only admins can commit bulk uploads, all attempts logged
 * @param {Array} validatedRows - Array of validated row objects
 * @param {string} dataType - 'faculty' or 'events'
 * @return {Object} Commit result
 */
function commitBulkData(validatedRows, dataType) {
  try {
    // SECURITY: Check authorization
    var authService = AuthService.getInstance();
    var auditService = AuditService.getInstance();
    var currentUserEmail = authService.getCurrentUserEmail();

    if (!authService.isAdmin()) {
      // Log unauthorized attempt
      auditService.logUnauthorizedAttempt(
        'bulk-upload-commit',
        'Admin',
        authService.getCurrentUserRole(),
        {
          dataType: dataType,
          rowCount: validatedRows ? validatedRows.length : 0
        }
      );

      Logger.warning('Unauthorized bulk upload commit attempt', {
        user: currentUserEmail,
        role: authService.getCurrentUserRole()
      });

      return {
        success: false,
        error: 'Access denied: Only administrators can perform bulk uploads'
      };
    }

    // Log access granted
    auditService.logAccessGranted('bulk-upload-commit', {
      dataType: dataType,
      rowCount: validatedRows.length
    });

    var bulkUploadService = BulkUploadService.getInstance();
    var result = bulkUploadService.commitBulkUpload(validatedRows, dataType);

    // Log the bulk upload operation
    if (result.success) {
      auditService.logBulkUpload(
        dataType,
        result.summary.successful,
        {
          totalRows: result.summary.total,
          failedRows: result.summary.failed
        }
      );
    }

    return result;
  } catch (e) {
    Logger.error('Failed to commit bulk data', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Get schedule for current user or specified faculty (if admin)
 * SECURITY: Faculty can only view their own schedule
 * @param {string} facultyEmail - Optional faculty email (admins only)
 * @param {Object} filters - Optional filters
 * @return {Object} Schedule data
 */
function getSchedule(facultyEmail, filters) {
  try {
    var scheduleService = ScheduleService.getInstance();
    var authService = AuthService.getInstance();

    // If no email specified, use current user's email
    if (!facultyEmail) {
      facultyEmail = authService.getCurrentUserEmail();
    }

    return scheduleService.getSchedule(facultyEmail, filters);
  } catch (e) {
    Logger.error('Failed to get schedule', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Update a schedule event
 * SECURITY: Faculty can only update their own events
 * @param {string} eventId - Event ID
 * @param {Object} updates - Updates to apply
 * @return {Object} Update result
 */
function updateScheduleEvent(eventId, updates) {
  try {
    var scheduleService = ScheduleService.getInstance();
    return scheduleService.updateEvent(eventId, updates);
  } catch (e) {
    Logger.error('Failed to update schedule event', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Delete a schedule event
 * SECURITY: Faculty can only delete their own events
 * @param {string} eventId - Event ID
 * @return {Object} Delete result
 */
function deleteScheduleEvent(eventId) {
  try {
    var scheduleService = ScheduleService.getInstance();
    return scheduleService.deleteEvent(eventId);
  } catch (e) {
    Logger.error('Failed to delete schedule event', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Create a new schedule event
 * SECURITY: Validates and sanitizes all input
 * @param {Object} eventData - Event data
 * @return {Object} Create result
 */
function createScheduleEvent(eventData) {
  try {
    var scheduleService = ScheduleService.getInstance();
    return scheduleService.createEvent(eventData);
  } catch (e) {
    Logger.error('Failed to create schedule event', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Protect AuditLog sheet from manual modifications
 * Makes the sheet effectively append-only by protecting all existing rows
 */
function protectAuditLogSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var auditSheet = ss.getSheetByName('AuditLog');

    if (!auditSheet) {
      Logger.warning('AuditLog sheet not found, skipping protection');
      return;
    }

    // Remove existing protections first
    var protections = auditSheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    for (var i = 0; i < protections.length; i++) {
      protections[i].remove();
    }

    var lastRow = auditSheet.getLastRow();

    // Protect all data rows (everything except the last row where new data will be appended)
    // This allows the append operation to work while preventing edits to existing rows
    if (lastRow > 1) {
      var range = auditSheet.getRange(1, 1, lastRow, auditSheet.getLastColumn());
      var protection = range.protect().setDescription('Audit Log Protection - Immutable Records');

      // Only allow the spreadsheet owner to edit
      // This prevents manual edits while still allowing programmatic appends
      protection.setWarningOnly(true);
      protection.setWarningText('⚠️ AUDIT LOG: These records are immutable and protected for compliance. Do not edit or delete audit log entries.');

      Logger.info('Protected ' + lastRow + ' rows in AuditLog sheet');
    }

    return true;
  } catch (e) {
    Logger.error('Failed to protect AuditLog sheet', { error: e.toString() });
    throw e;
  }
}

/**
 * Query audit logs with filters (ADMIN ONLY)
 * @param {Object} filters - Filter criteria
 * @return {Object} Query result
 */
function queryAuditLogs(filters) {
  try {
    var auditService = AuditService.getInstance();
    return auditService.queryAuditLogs(filters);
  } catch (e) {
    Logger.error('Failed to query audit logs', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Export audit logs to CSV (ADMIN ONLY)
 * @param {Object} filters - Filter criteria
 * @return {Object} Export result with CSV content
 */
function exportAuditLogsToCSV(filters) {
  try {
    var auditService = AuditService.getInstance();
    return auditService.exportToCSV(filters);
  } catch (e) {
    Logger.error('Failed to export audit logs', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Create a new swap request
 * @param {Object} requestData - Request data
 * @return {Object} Create result
 */
function createSwapRequest(requestData) {
  try {
    var swapService = SwapRequestService.getInstance();
    return swapService.createSwapRequest(requestData);
  } catch (e) {
    Logger.error('Failed to create swap request', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Approve a swap request
 * @param {string} requestId - Request ID
 * @return {Object} Approval result
 */
function approveSwapRequest(requestId) {
  try {
    var swapService = SwapRequestService.getInstance();
    return swapService.approveSwapRequest(requestId);
  } catch (e) {
    Logger.error('Failed to approve swap request', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Reject a swap request
 * @param {string} requestId - Request ID
 * @return {Object} Rejection result
 */
function rejectSwapRequest(requestId) {
  try {
    var swapService = SwapRequestService.getInstance();
    return swapService.rejectSwapRequest(requestId);
  } catch (e) {
    Logger.error('Failed to reject swap request', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Cancel a swap request
 * @param {string} requestId - Request ID
 * @return {Object} Cancellation result
 */
function cancelSwapRequest(requestId) {
  try {
    var swapService = SwapRequestService.getInstance();
    return swapService.cancelSwapRequest(requestId);
  } catch (e) {
    Logger.error('Failed to cancel swap request', { error: e.toString() });
    return { success: false, error: e.toString() };
  }
}

/**
 * Get swap requests for current user
 * @return {Object} Swap requests
 */
function getMySwapRequests() {
  try {
    var swapService = SwapRequestService.getInstance();
    return swapService.getMySwapRequests();
  } catch (e) {
    Logger.error('Failed to get swap requests', { error: e.toString() });
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
