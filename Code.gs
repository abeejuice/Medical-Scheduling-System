/**
 * Code.gs - Main entry point for the Medical Scheduling System
 * This file contains menu creation and public functions
 */

/**
 * Called when the spreadsheet is opened
 * Creates custom menu
 */
function onOpen() {
  var logger = Logger.getInstance();

  try {
    var ui = SpreadsheetApp.getUi();

    ui.createMenu('Medical Scheduling')
      .addSubMenu(ui.createMenu('Setup')
        .addItem('Initialize Spreadsheet', 'initializeSpreadsheet')
        .addItem('Add Sample Data', 'addSampleData')
        .addSeparator()
        .addItem('Reset Spreadsheet', 'resetSpreadsheet'))
      .addSeparator()
      .addSubMenu(ui.createMenu('Faculty')
        .addItem('View My Schedule', 'viewMySchedule')
        .addItem('Request Schedule Swap', 'showSwapRequestDialog'))
      .addSubMenu(ui.createMenu('Admin')
        .addItem('Manage Faculty', 'manageFaculty')
        .addItem('View All Schedules', 'viewAllSchedules')
        .addItem('Review Swap Requests', 'reviewSwapRequests'))
      .addSeparator()
      .addSubMenu(ui.createMenu('Testing')
        .addItem('Test Services', 'testServices')
        .addItem('Run All Tests', 'runAllTests')
        .addItem('Test OAuth Scopes', 'testOAuthScopes')
        .addItem('Benchmark Performance', 'benchmarkSheetManager'))
      .addSeparator()
      .addItem('About', 'showAbout')
      .addToUi();

    logger.info('Menu created successfully');

  } catch (e) {
    logger.error('Failed to create menu', { error: e.toString() });
  }
}

/**
 * Test function to verify all services are working
 */
function testServices() {
  var logger = Logger.getInstance();

  try {
    logger.info('Starting service tests');

    // Test Logger
    logger.info('Logger test: INFO level');
    logger.warning('Logger test: WARNING level');

    // Test SheetManager
    var sheetManager = SheetManager.getInstance();
    logger.info('SheetManager instance created successfully');

    var sheets = ['Faculty', 'Schedule', 'SwapRequests', 'AuditLog'];
    for (var i = 0; i < sheets.length; i++) {
      try {
        var sheet = sheetManager.getSheet(sheets[i]);
        logger.info('Sheet accessible', { sheetName: sheets[i] });
      } catch (e) {
        logger.error('Sheet not accessible', {
          sheetName: sheets[i],
          error: e.toString()
        });
      }
    }

    // Test AuthService
    var authService = AuthService.getInstance();
    logger.info('AuthService instance created successfully');

    try {
      var currentUser = authService.getCurrentUser();
      logger.info('Current user retrieved', {
        email: currentUser.email,
        role: currentUser.role
      });

      SpreadsheetApp.getUi().alert(
        'Service Test Results',
        'Current User: ' + currentUser.name + '\n' +
        'Email: ' + currentUser.email + '\n' +
        'Role: ' + currentUser.role + '\n\n' +
        'All services are operational!',
        SpreadsheetApp.getUi().ButtonSet.OK
      );

    } catch (e) {
      logger.warning('User not found in Faculty sheet', { error: e.toString() });
      SpreadsheetApp.getUi().alert(
        'Service Test Results',
        'Services are operational, but current user is not in Faculty sheet.\n\n' +
        'Please add your email to the Faculty sheet or run "Add Sample Data".',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }

    logger.info('Service tests completed');

  } catch (e) {
    logger.critical('Service test failed', { error: e.toString() });
    SpreadsheetApp.getUi().alert(
      'Service Test Failed',
      'Error: ' + e.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    throw e;
  }
}

/**
 * View current user's schedule
 */
function viewMySchedule() {
  var logger = Logger.getInstance();
  var authService = AuthService.getInstance();
  var sheetManager = SheetManager.getInstance();

  try {
    var user = authService.getCurrentUser();
    logger.info('Viewing schedule for user', { email: user.email });

    if (user.role === authService.Role.UNKNOWN) {
      SpreadsheetApp.getUi().alert(
        'Access Denied',
        'You are not registered in the Faculty sheet.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }

    // Get user's schedules
    var schedules = sheetManager.queryByColumn('Schedule', 2, user.facultyId);

    if (schedules.length === 0) {
      SpreadsheetApp.getUi().alert(
        'My Schedule',
        'You have no scheduled shifts.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }

    var message = 'Your upcoming schedules:\n\n';
    for (var i = 0; i < schedules.length; i++) {
      var sched = schedules[i].data;
      message += 'Date: ' + sched.Date + '\n';
      message += 'Time: ' + sched.StartTime + ' - ' + sched.EndTime + '\n';
      message += 'Location: ' + sched.Location + '\n';
      message += 'Type: ' + sched.Type + '\n';
      message += 'Status: ' + sched.Status + '\n\n';
    }

    SpreadsheetApp.getUi().alert(
      'My Schedule',
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (e) {
    logger.error('Failed to view schedule', { error: e.toString() });
    SpreadsheetApp.getUi().alert(
      'Error',
      'Failed to load schedule: ' + e.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Show swap request dialog (placeholder)
 */
function showSwapRequestDialog() {
  SpreadsheetApp.getUi().alert(
    'Schedule Swap Request',
    'This feature will be implemented in the next phase.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Manage faculty (admin only)
 */
function manageFaculty() {
  var logger = Logger.getInstance();
  var authService = AuthService.getInstance();

  try {
    authService.requireAdmin();

    var sheetManager = SheetManager.getInstance();
    var faculty = sheetManager.getAllRows('Faculty');

    var message = 'Registered Faculty (' + faculty.length + '):\n\n';
    for (var i = 0; i < faculty.length; i++) {
      var fac = faculty[i].data;
      message += fac.Name + ' (' + fac.Role + ')\n';
      message += 'Email: ' + fac.Email + '\n';
      message += 'Department: ' + fac.Department + '\n\n';
    }

    SpreadsheetApp.getUi().alert(
      'Faculty Management',
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (e) {
    logger.error('Failed to manage faculty', { error: e.toString() });
    SpreadsheetApp.getUi().alert(
      'Error',
      e.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * View all schedules (admin only)
 */
function viewAllSchedules() {
  var logger = Logger.getInstance();
  var authService = AuthService.getInstance();

  try {
    authService.requireAdmin();

    var sheetManager = SheetManager.getInstance();
    var schedules = sheetManager.getAllRows('Schedule');

    if (schedules.length === 0) {
      SpreadsheetApp.getUi().alert(
        'All Schedules',
        'No schedules found.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }

    var message = 'All Schedules (' + schedules.length + '):\n\n';
    for (var i = 0; i < Math.min(schedules.length, 5); i++) {
      var sched = schedules[i].data;
      message += sched.FacultyName + '\n';
      message += 'Date: ' + sched.Date + ' | ' + sched.StartTime + '-' + sched.EndTime + '\n';
      message += 'Location: ' + sched.Location + '\n\n';
    }

    if (schedules.length > 5) {
      message += '... and ' + (schedules.length - 5) + ' more.\n';
    }

    SpreadsheetApp.getUi().alert(
      'All Schedules',
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (e) {
    logger.error('Failed to view all schedules', { error: e.toString() });
    SpreadsheetApp.getUi().alert(
      'Error',
      e.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Review swap requests (admin only)
 */
function reviewSwapRequests() {
  var logger = Logger.getInstance();
  var authService = AuthService.getInstance();

  try {
    authService.requireAdmin();

    SpreadsheetApp.getUi().alert(
      'Swap Request Review',
      'This feature will be implemented in the next phase.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (e) {
    logger.error('Failed to review swap requests', { error: e.toString() });
    SpreadsheetApp.getUi().alert(
      'Error',
      e.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Show about dialog
 */
function showAbout() {
  SpreadsheetApp.getUi().alert(
    'Medical Scheduling System',
    'Version: 1.0.0\n\n' +
    'A comprehensive scheduling system for medical college departments.\n\n' +
    'Features:\n' +
    '- Faculty schedule management\n' +
    '- Schedule swap requests\n' +
    '- Role-based access control\n' +
    '- Audit logging\n\n' +
    'Built with Google Apps Script',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
