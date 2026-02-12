/**
 * Logger utility for error logging with timestamp and severity level
 */
var Logger = (function() {
  'use strict';

  var Severity = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
  };

  /**
   * Log a message with timestamp and severity
   * @param {string} message - The message to log
   * @param {string} severity - The severity level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
   * @param {Object} metadata - Optional metadata object
   */
  function log(message, severity, metadata) {
    severity = severity || Severity.INFO;
    var timestamp = new Date().toISOString();
    var logEntry = {
      timestamp: timestamp,
      severity: severity,
      message: message
    };

    if (metadata) {
      logEntry.metadata = metadata;
    }

    var formattedMessage = '[' + timestamp + '] [' + severity + '] ' + message;

    if (metadata) {
      formattedMessage += ' | ' + JSON.stringify(metadata);
    }

    // Log to Apps Script console
    console.log(formattedMessage);

    // Also log to AuditLog sheet for ERROR and CRITICAL severities
    if (severity === Severity.ERROR || severity === Severity.CRITICAL) {
      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        if (ss) {
          var auditSheet = ss.getSheetByName('AuditLog');
          if (auditSheet) {
            auditSheet.appendRow([
              timestamp,
              severity,
              message,
              metadata ? JSON.stringify(metadata) : '',
              Session.getActiveUser().getEmail()
            ]);
          }
        }
      } catch (e) {
        // If we can't log to sheet, at least log to console
        console.error('Failed to log to AuditLog sheet: ' + e.toString());
      }
    }

    return logEntry;
  }

  /**
   * Log debug message
   */
  function debug(message, metadata) {
    return log(message, Severity.DEBUG, metadata);
  }

  /**
   * Log info message
   */
  function info(message, metadata) {
    return log(message, Severity.INFO, metadata);
  }

  /**
   * Log warning message
   */
  function warning(message, metadata) {
    return log(message, Severity.WARNING, metadata);
  }

  /**
   * Log error message
   */
  function error(message, metadata) {
    return log(message, Severity.ERROR, metadata);
  }

  /**
   * Log critical message
   */
  function critical(message, metadata) {
    return log(message, Severity.CRITICAL, metadata);
  }

  return {
    Severity: Severity,
    log: log,
    debug: debug,
    info: info,
    warning: warning,
    error: error,
    critical: critical
  };
})();
