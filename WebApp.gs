/**
 * WebApp.gs - Main web application handler for deployment
 * Handles routing to admin, faculty, and audit pages
 */

/**
 * Main web app entry point - handles GET requests
 * Routes to different pages based on query parameters and user role
 * @param {Object} e - Event parameter with query string
 * @return {HtmlOutput} The page to display
 */
function doGet(e) {
  try {
    var page = e.parameter.page || 'home';
    var authService = AuthService.getInstance();
    var auditService = AuditService.getInstance();

    // Log access attempt
    auditService.logAccessGranted('webapp', {
      page: page,
      queryParams: JSON.stringify(e.parameter)
    });

    // Route to appropriate page
    switch(page) {
      case 'admin':
        return getAdminPage();
      case 'faculty':
        return getFacultyPage();
      case 'audit':
        return getAuditPage();
      case 'schedule':
        return getSchedulePage();
      default:
        return getHomePage();
    }
  } catch (error) {
    Logger.critical('Web app error', {
      error: error.toString(),
      stack: error.stack
    });

    return HtmlService.createHtmlOutput(
      '<h1>Error</h1>' +
      '<p>An error occurred: ' + SecurityUtils.sanitize(error.message) + '</p>' +
      '<p><a href="?">Return to home</a></p>'
    ).setTitle('Error');
  }
}

/**
 * Handle POST requests for web app
 * @param {Object} e - Event parameter
 * @return {ContentService.TextOutput} JSON response
 */
function doPost(e) {
  try {
    var action = e.parameter.action;
    var authService = AuthService.getInstance();
    var auditService = AuditService.getInstance();

    // Log POST attempt
    auditService.logEvent('DATA_MODIFICATION', 'POST request received', {
      action: action
    });

    var response = { success: false, error: 'Invalid action' };

    // Route to appropriate handler
    switch(action) {
      case 'syncCalendar':
        response = syncAllCalendars();
        break;
      case 'getSchedule':
        var email = e.parameter.email;
        response = getSchedule(email);
        break;
      default:
        response = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.critical('POST request error', {
      error: error.toString(),
      stack: error.stack
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get home page with navigation
 * @return {HtmlOutput}
 */
function getHomePage() {
  var authService = AuthService.getInstance();
  var currentUser = authService.getCurrentUser();
  var userRole = authService.getCurrentUserRole();

  var html = '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Medical Scheduling System</title>' +
    '<style>' +
    'body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }' +
    'h1 { color: #1a73e8; }' +
    '.user-info { background: #f1f3f4; padding: 15px; border-radius: 8px; margin-bottom: 20px; }' +
    '.nav-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }' +
    '.card { background: white; border: 1px solid #dadce0; border-radius: 8px; padding: 20px; cursor: pointer; transition: box-shadow 0.3s; }' +
    '.card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }' +
    '.card h2 { margin-top: 0; color: #1a73e8; }' +
    '.card p { color: #5f6368; }' +
    '.status { margin-top: 30px; padding: 15px; background: #e8f5e9; border-radius: 8px; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<h1>🏥 Medical Scheduling System</h1>';

  if (currentUser) {
    html += '<div class="user-info">' +
      '<strong>Welcome:</strong> ' + SecurityUtils.sanitize(currentUser.Name) + '<br>' +
      '<strong>Email:</strong> ' + SecurityUtils.sanitize(currentUser.Email) + '<br>' +
      '<strong>Role:</strong> ' + SecurityUtils.sanitize(userRole) + '<br>' +
      '<strong>Department:</strong> ' + SecurityUtils.sanitize(currentUser.Department || 'N/A') +
      '</div>';
  } else {
    html += '<div class="user-info">' +
      '<strong>Status:</strong> Not registered in system. Contact administrator.' +
      '</div>';
  }

  html += '<div class="nav-cards">';

  // Faculty schedule card (available to all registered users)
  if (currentUser) {
    html += '<div class="card" onclick="window.location.href=\'?page=schedule\'">' +
      '<h2>📅 My Schedule</h2>' +
      '<p>View your upcoming duties and schedule</p>' +
      '</div>';
  }

  // Admin card (only for admins)
  if (userRole === 'Admin') {
    html += '<div class="card" onclick="window.location.href=\'?page=admin\'">' +
      '<h2>⚙️ Admin Panel</h2>' +
      '<p>Manage faculty, upload schedules, and configure system</p>' +
      '</div>';

    html += '<div class="card" onclick="window.location.href=\'?page=audit\'">' +
      '<h2>🔍 Audit Logs</h2>' +
      '<p>View system audit trail and security events</p>' +
      '</div>';
  }

  html += '</div>';

  // System status
  html += '<div class="status">' +
    '<strong>✅ System Status:</strong> Live and operational<br>' +
    '<strong>Last Updated:</strong> ' + new Date().toLocaleString() +
    '</div>';

  html += '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('Medical Scheduling System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get admin page
 * @return {HtmlOutput}
 */
function getAdminPage() {
  var authService = AuthService.getInstance();
  var auditService = AuditService.getInstance();

  if (!authService.isAdmin()) {
    auditService.logAccessDenied('admin-page', 'Admin role required', {
      role: authService.getCurrentUserRole()
    });

    return HtmlService.createHtmlOutput(
      '<h1>Access Denied</h1>' +
      '<p>Only administrators can access this page.</p>' +
      '<p><a href="?">Return to home</a></p>'
    ).setTitle('Access Denied');
  }

  // Return the bulk upload UI
  var html = HtmlService.createHtmlOutputFromFile('BulkUploadUI')
    .setTitle('Admin Panel - Bulk Upload')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  return html;
}

/**
 * Get faculty schedule page
 * @return {HtmlOutput}
 */
function getFacultyPage() {
  return getSchedulePage();
}

/**
 * Get schedule page
 * @return {HtmlOutput}
 */
function getSchedulePage() {
  var authService = AuthService.getInstance();
  var currentUser = authService.getCurrentUser();

  if (!currentUser) {
    return HtmlService.createHtmlOutput(
      '<h1>Access Denied</h1>' +
      '<p>You must be registered in the Faculty sheet to view your schedule.</p>' +
      '<p><a href="?">Return to home</a></p>'
    ).setTitle('Access Denied');
  }

  var html = HtmlService.createHtmlOutputFromFile('FacultyScheduleView')
    .setTitle('My Schedule')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  return html;
}

/**
 * Get audit log viewer page
 * @return {HtmlOutput}
 */
function getAuditPage() {
  var authService = AuthService.getInstance();
  var auditService = AuditService.getInstance();

  if (!authService.isAdmin()) {
    auditService.logAccessDenied('audit-page', 'Admin role required', {
      role: authService.getCurrentUserRole()
    });

    return HtmlService.createHtmlOutput(
      '<h1>Access Denied</h1>' +
      '<p>Only administrators can access audit logs.</p>' +
      '<p><a href="?">Return to home</a></p>'
    ).setTitle('Access Denied');
  }

  var html = HtmlService.createHtmlOutputFromFile('AuditLogViewer')
    .setTitle('Audit Log Viewer')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  return html;
}

/**
 * Get the deployed web app URL
 * This function helps admins get the deployment URL
 * @return {string} The web app URL
 */
function getWebAppUrl() {
  var url = ScriptApp.getService().getUrl();
  Logger.info('Web app URL retrieved', { url: url });
  return url;
}

/**
 * Show web app URL dialog
 * Displays the deployed web app URL to the user
 */
function showWebAppUrl() {
  try {
    var url = getWebAppUrl();
    var ui = SpreadsheetApp.getUi();

    ui.alert(
      'Web App Deployed',
      'Your Medical Scheduling System is accessible at:\n\n' + url + '\n\n' +
      'Share this URL with faculty and administrators.',
      ui.ButtonSet.OK
    );
  } catch (e) {
    Logger.error('Failed to show web app URL', { error: e.toString() });
    SpreadsheetApp.getUi().alert('Error', 'Failed to get web app URL: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
