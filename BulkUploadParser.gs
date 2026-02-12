/**
 * BulkUploadParser - Parses Word table data pasted into the system
 * Handles date parsing with ambiguity detection and fast preview generation
 */
var BulkUploadParser = (function() {
  var instance;
  var logger = Logger.getInstance();

  function createInstance() {
    return {
      /**
       * Parse pasted data into structured rows
       * @param {string} rawData - Tab-delimited data from Word table
       * @param {string} dataType - 'faculty' or 'events'
       * @returns {Object} Parsed result with rows and metadata
       */
      parse: function(rawData, dataType) {
        var startTime = new Date().getTime();

        try {
          if (!rawData || rawData.trim().length === 0) {
            throw new Error('No data provided');
          }

          var lines = rawData.trim().split('\n');
          var rows = [];

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.length === 0) continue;

            var cells = this._splitTabDelimited(line);

            if (dataType === 'faculty') {
              rows.push(this._parseFacultyRow(cells, i + 1));
            } else if (dataType === 'events') {
              rows.push(this._parseEventRow(cells, i + 1));
            }
          }

          var endTime = new Date().getTime();
          var duration = (endTime - startTime) / 1000;

          logger.info('Parsed bulk upload data', {
            dataType: dataType,
            rowCount: rows.length,
            durationSeconds: duration
          });

          return {
            success: true,
            rows: rows,
            totalRows: rows.length,
            parseTime: duration,
            dataType: dataType
          };

        } catch (e) {
          logger.error('Failed to parse bulk upload data', { error: e.toString() });
          return {
            success: false,
            error: e.toString(),
            rows: []
          };
        }
      },

      /**
       * Split line by tabs, handling quoted values
       * @param {string} line - Line to split
       * @returns {Array} Array of cell values
       */
      _splitTabDelimited: function(line) {
        var cells = [];
        var current = '';
        var inQuotes = false;

        for (var i = 0; i < line.length; i++) {
          var char = line.charAt(i);

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === '\t' && !inQuotes) {
            cells.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }

        cells.push(current.trim());
        return cells;
      },

      /**
       * Parse a faculty row
       * Expected format: Name | Email | Department | Specialty | Role | Phone
       * @param {Array} cells - Array of cell values
       * @param {number} lineNumber - Line number for error reporting
       * @returns {Object} Parsed faculty data
       */
      _parseFacultyRow: function(cells, lineNumber) {
        return {
          lineNumber: lineNumber,
          raw: cells,
          parsed: {
            name: cells[0] || '',
            email: cells[1] || '',
            department: cells[2] || '',
            specialty: cells[3] || '',
            role: cells[4] || 'Faculty',
            phone: cells[5] || ''
          },
          validation: {
            errors: [],
            warnings: []
          }
        };
      },

      /**
       * Parse an event row
       * Expected format: FacultyName | Date | StartTime | EndTime | Location | Type | Notes
       * @param {Array} cells - Array of cell values
       * @param {number} lineNumber - Line number for error reporting
       * @returns {Object} Parsed event data
       */
      _parseEventRow: function(cells, lineNumber) {
        var dateResult = this._parseDate(cells[1] || '');

        return {
          lineNumber: lineNumber,
          raw: cells,
          parsed: {
            facultyName: cells[0] || '',
            date: dateResult.value,
            dateOriginal: cells[1] || '',
            startTime: cells[2] || '',
            endTime: cells[3] || '',
            location: cells[4] || '',
            type: cells[5] || 'Clinic',
            notes: cells[6] || ''
          },
          dateAmbiguous: dateResult.ambiguous,
          dateFormat: dateResult.format,
          validation: {
            errors: [],
            warnings: []
          }
        };
      },

      /**
       * Parse date string with ambiguity detection
       * @param {string} dateStr - Date string to parse
       * @returns {Object} Parse result with ambiguity flag
       */
      _parseDate: function(dateStr) {
        if (!dateStr || dateStr.trim().length === 0) {
          return {
            value: null,
            ambiguous: false,
            format: 'unknown',
            error: 'Empty date'
          };
        }

        dateStr = dateStr.trim();

        // Try unambiguous formats first
        var unambiguousFormats = [
          { pattern: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, type: 'ISO', order: 'YMD' },
          { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, type: 'US_YEAR4', order: 'MDY4' },
          { pattern: /^(\d{1,2})-([A-Za-z]{3,})-(\d{4})$/, type: 'DAY_MONTH_YEAR', order: 'DMY' },
          { pattern: /^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/, type: 'MONTH_DAY_YEAR', order: 'MDY' }
        ];

        for (var i = 0; i < unambiguousFormats.length; i++) {
          var fmt = unambiguousFormats[i];
          var match = dateStr.match(fmt.pattern);

          if (match) {
            var dateObj = this._buildDate(match, fmt.order);
            if (dateObj) {
              return {
                value: Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
                ambiguous: false,
                format: fmt.type
              };
            }
          }
        }

        // Check for ambiguous format: ##/##/## or ##/##/####
        var ambiguousPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
        var ambiguousMatch = dateStr.match(ambiguousPattern);

        if (ambiguousMatch) {
          var num1 = parseInt(ambiguousMatch[1], 10);
          var num2 = parseInt(ambiguousMatch[2], 10);
          var year = parseInt(ambiguousMatch[3], 10);

          // Check if it's clearly unambiguous (day > 12)
          if (num1 > 12 && num2 <= 12) {
            // Must be DD/MM/YY
            var dateObj = this._buildDate([null, num1, num2, year], 'DMY');
            if (dateObj) {
              return {
                value: Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
                ambiguous: false,
                format: 'DD/MM/YYYY'
              };
            }
          } else if (num2 > 12 && num1 <= 12) {
            // Must be MM/DD/YY
            var dateObj = this._buildDate([null, num1, num2, year], 'MDY');
            if (dateObj) {
              return {
                value: Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
                ambiguous: false,
                format: 'MM/DD/YYYY'
              };
            }
          } else {
            // Ambiguous - could be either format
            return {
              value: dateStr,
              ambiguous: true,
              format: 'AMBIGUOUS',
              possibleInterpretations: [
                { format: 'MM/DD/YYYY', interpretation: num1 + '/' + num2 + '/' + year },
                { format: 'DD/MM/YYYY', interpretation: num2 + '/' + num1 + '/' + year }
              ]
            };
          }
        }

        // Failed to parse
        return {
          value: dateStr,
          ambiguous: false,
          format: 'UNKNOWN',
          error: 'Unable to parse date format'
        };
      },

      /**
       * Build Date object from parsed components
       * @param {Array} match - Regex match array
       * @param {string} order - Component order (e.g., 'YMD', 'MDY', 'DMY')
       * @returns {Date|null} Date object or null if invalid
       */
      _buildDate: function(match, order) {
        try {
          var year, month, day;

          if (order === 'YMD') {
            year = parseInt(match[1], 10);
            month = parseInt(match[2], 10) - 1;
            day = parseInt(match[3], 10);
          } else if (order === 'MDY' || order === 'MDY4') {
            month = parseInt(match[1], 10) - 1;
            day = parseInt(match[2], 10);
            year = parseInt(match[3], 10);
          } else if (order === 'DMY') {
            day = parseInt(match[1], 10);
            month = parseInt(match[2], 10) - 1;
            year = parseInt(match[3], 10);
          }

          // Handle 2-digit years
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }

          // Handle month names
          if (typeof match[1] === 'string' && isNaN(parseInt(match[1], 10))) {
            var monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                             'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            var monthStr = match[1].toLowerCase().substring(0, 3);
            month = monthNames.indexOf(monthStr);
          }
          if (typeof match[2] === 'string' && isNaN(parseInt(match[2], 10))) {
            var monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                             'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            var monthStr = match[2].toLowerCase().substring(0, 3);
            month = monthNames.indexOf(monthStr);
          }

          var dateObj = new Date(year, month, day);

          // Validate the date
          if (dateObj.getFullYear() === year &&
              dateObj.getMonth() === month &&
              dateObj.getDate() === day) {
            return dateObj;
          }

          return null;
        } catch (e) {
          return null;
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
