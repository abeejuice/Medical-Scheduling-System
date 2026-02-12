/**
 * Logger utility for consistent error logging with timestamp and severity
 */
var Logger = (function() {
  var instance;

  function createInstance() {
    return {
      /**
       * Log levels
       */
      Level: {
        INFO: 'INFO',
        WARNING: 'WARNING',
        ERROR: 'ERROR',
        CRITICAL: 'CRITICAL'
      },

      /**
       * Log a message with timestamp and severity
       * @param {string} message - The log message
       * @param {string} level - The severity level
       * @param {Object} metadata - Additional metadata to log
       */
      log: function(message, level, metadata) {
        level = level || this.Level.INFO;
        var timestamp = new Date().toISOString();
        var logEntry = {
          timestamp: timestamp,
          level: level,
          message: message,
          metadata: metadata || {}
        };

        // Log to console
        console.log(JSON.stringify(logEntry));

        // Also use built-in Logger for Apps Script logging
        var logMessage = '[' + timestamp + '] [' + level + '] ' + message;
        if (metadata) {
          logMessage += ' | ' + JSON.stringify(metadata);
        }
        Logger.log(logMessage);

        // Write critical errors to AuditLog sheet
        if (level === this.Level.ERROR || level === this.Level.CRITICAL) {
          try {
            this._logToAuditSheet(timestamp, level, message, metadata);
          } catch (e) {
            console.error('Failed to write to AuditLog: ' + e.toString());
          }
        }
      },

      /**
       * Log info level message
       */
      info: function(message, metadata) {
        this.log(message, this.Level.INFO, metadata);
      },

      /**
       * Log warning level message
       */
      warning: function(message, metadata) {
        this.log(message, this.Level.WARNING, metadata);
      },

      /**
       * Log error level message
       */
      error: function(message, metadata) {
        this.log(message, this.Level.ERROR, metadata);
      },

      /**
       * Log critical level message
       */
      critical: function(message, metadata) {
        this.log(message, this.Level.CRITICAL, metadata);
      },

      /**
       * Write error to AuditLog sheet
       * @private
       */
      _logToAuditSheet: function(timestamp, level, message, metadata) {
        try {
          var ss = SpreadsheetApp.getActiveSpreadsheet();
          var auditSheet = ss.getSheetByName('AuditLog');

          if (auditSheet) {
            auditSheet.appendRow([
              timestamp,
              Session.getActiveUser().getEmail() || 'system',
              'ERROR_LOG',
              level + ': ' + message,
              JSON.stringify(metadata)
            ]);
          }
        } catch (e) {
          console.error('Failed to write to AuditLog sheet: ' + e.toString());
        }
      }
    };
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();
