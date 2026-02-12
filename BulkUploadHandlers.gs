/**
 * BulkUploadHandlers - Server-side functions for bulk upload
 * Connects UI to parsing, validation, and data persistence
 */

/**
 * Show bulk upload dialog
 */
function showBulkUploadDialog() {
  var logger = Logger.getInstance();
  var authService = AuthService.getInstance();

  try {
    authService.requireAdmin();

    var html = HtmlService.createHtmlOutputFromFile('BulkUpload')
      .setWidth(1200)
      .setHeight(700)
      .setTitle('Bulk Upload - Faculty & Events');

    SpreadsheetApp.getUi().showModalDialog(html, 'Bulk Upload');

    logger.info('Bulk upload dialog opened');

  } catch (e) {
    logger.error('Failed to show bulk upload dialog', { error: e.toString() });
    SpreadsheetApp.getUi().alert(
      'Error',
      e.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Process faculty upload data
 * @param {string} rawData - Tab-delimited faculty data
 * @returns {Object} Parsed and validated result
 */
function processFacultyUpload(rawData) {
  var logger = Logger.getInstance();
  var startTime = new Date().getTime();

  try {
    logger.info('Processing faculty upload', { dataLength: rawData.length });

    // Parse data
    var parser = BulkUploadParser.getInstance();
    var parseResult = parser.parse(rawData, 'faculty');

    if (!parseResult.success) {
      return parseResult;
    }

    // Get existing faculty for validation
    var sheetManager = SheetManager.getInstance();
    var existingFaculty = sheetManager.getAllRows('Faculty');

    // Validate
    var validator = BulkUploadValidator.getInstance();
    var validationResult = validator.validateFaculty(parseResult.rows, existingFaculty);

    var endTime = new Date().getTime();
    var totalTime = (endTime - startTime) / 1000;

    logger.info('Faculty upload processed', {
      totalRows: parseResult.totalRows,
      validRows: validationResult.validCount,
      invalidRows: validationResult.invalidCount,
      processingTime: totalTime
    });

    return {
      success: true,
      totalRows: parseResult.totalRows,
      validCount: validationResult.validCount,
      invalidCount: validationResult.invalidCount,
      validRows: validationResult.validRows,
      invalidRows: validationResult.invalidRows,
      allRows: validationResult.validRows.concat(validationResult.invalidRows),
      processingTime: totalTime
    };

  } catch (e) {
    logger.error('Faculty upload processing failed', { error: e.toString() });
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * Process events upload data
 * @param {string} rawData - Tab-delimited events data
 * @returns {Object} Parsed and validated result
 */
function processEventsUpload(rawData) {
  var logger = Logger.getInstance();
  var startTime = new Date().getTime();

  try {
    logger.info('Processing events upload', { dataLength: rawData.length });

    // Parse data
    var parser = BulkUploadParser.getInstance();
    var parseResult = parser.parse(rawData, 'events');

    if (!parseResult.success) {
      return parseResult;
    }

    // Get existing data for validation
    var sheetManager = SheetManager.getInstance();
    var existingFaculty = sheetManager.getAllRows('Faculty');
    var existingSchedules = sheetManager.getAllRows('Schedule');

    // Validate
    var validator = BulkUploadValidator.getInstance();
    var validationResult = validator.validateEvents(parseResult.rows, existingFaculty, existingSchedules);

    var endTime = new Date().getTime();
    var totalTime = (endTime - startTime) / 1000;

    logger.info('Events upload processed', {
      totalRows: parseResult.totalRows,
      validRows: validationResult.validCount,
      invalidRows: validationResult.invalidCount,
      processingTime: totalTime
    });

    return {
      success: true,
      totalRows: parseResult.totalRows,
      validCount: validationResult.validCount,
      invalidCount: validationResult.invalidCount,
      validRows: validationResult.validRows,
      invalidRows: validationResult.invalidRows,
      allRows: validationResult.validRows.concat(validationResult.invalidRows),
      processingTime: totalTime
    };

  } catch (e) {
    logger.error('Events upload processing failed', { error: e.toString() });
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * Commit valid faculty data to Faculty sheet
 * @param {Array} validRows - Array of validated faculty rows
 * @returns {Object} Commit result with success count
 */
function commitFacultyData(validRows) {
  var logger = Logger.getInstance();
  var sheetManager = SheetManager.getInstance();
  var authService = AuthService.getInstance();

  try {
    authService.requireAdmin();

    var successCount = 0;
    var failedCount = 0;
    var currentUser = authService.getCurrentUser();

    for (var i = 0; i < validRows.length; i++) {
      try {
        var row = validRows[i];
        var parsed = row.parsed;

        // Generate FacultyID
        var facultyId = 'FAC' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss') + '-' + (i + 1);

        var rowData = [
          facultyId,
          parsed.name,
          parsed.email,
          parsed.department,
          parsed.specialty,
          parsed.role,
          parsed.phone,
          Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
        ];

        sheetManager.appendRow('Faculty', rowData);
        successCount++;

        logger.info('Faculty member added', {
          facultyId: facultyId,
          name: parsed.name,
          addedBy: currentUser.email
        });

      } catch (e) {
        logger.error('Failed to add faculty member', {
          row: i + 1,
          error: e.toString()
        });
        failedCount++;
      }
    }

    logger.info('Faculty bulk commit completed', {
      successCount: successCount,
      failedCount: failedCount
    });

    return {
      success: true,
      successCount: successCount,
      failedCount: failedCount
    };

  } catch (e) {
    logger.error('Faculty commit failed', { error: e.toString() });
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * Commit valid events data to Schedule sheet
 * @param {Array} validRows - Array of validated event rows
 * @returns {Object} Commit result with success count
 */
function commitEventsData(validRows) {
  var logger = Logger.getInstance();
  var sheetManager = SheetManager.getInstance();
  var authService = AuthService.getInstance();

  try {
    authService.requireAdmin();

    var successCount = 0;
    var failedCount = 0;
    var currentUser = authService.getCurrentUser();

    for (var i = 0; i < validRows.length; i++) {
      try {
        var row = validRows[i];
        var parsed = row.parsed;

        // Get matched faculty ID
        if (!row.facultyMatch || !row.facultyMatch.matched) {
          throw new Error('Faculty match not found for: ' + parsed.facultyName);
        }

        var faculty = row.facultyMatch.matchedFaculty.data;

        // Generate ScheduleID
        var scheduleId = 'SCH' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss') + '-' + (i + 1);

        var rowData = [
          scheduleId,
          faculty.FacultyID,
          faculty.Name,
          parsed.date,
          parsed.startTime,
          parsed.endTime,
          parsed.location,
          parsed.type,
          'Confirmed',
          parsed.notes,
          Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
          currentUser.email
        ];

        sheetManager.appendRow('Schedule', rowData);
        successCount++;

        logger.info('Event added', {
          scheduleId: scheduleId,
          facultyName: faculty.Name,
          date: parsed.date,
          addedBy: currentUser.email
        });

      } catch (e) {
        logger.error('Failed to add event', {
          row: i + 1,
          error: e.toString()
        });
        failedCount++;
      }
    }

    logger.info('Events bulk commit completed', {
      successCount: successCount,
      failedCount: failedCount
    });

    return {
      success: true,
      successCount: successCount,
      failedCount: failedCount
    };

  } catch (e) {
    logger.error('Events commit failed', { error: e.toString() });
    return {
      success: false,
      error: e.toString()
    };
  }
}
