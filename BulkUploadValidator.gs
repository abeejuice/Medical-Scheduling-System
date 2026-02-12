/**
 * BulkUploadValidator - Validates parsed bulk upload data
 * Checks for missing fields, date conflicts, time overlaps, and faculty matches
 */
var BulkUploadValidator = (function() {
  var instance;
  var logger = Logger.getInstance();

  function createInstance() {
    return {
      /**
       * Validate faculty rows
       * @param {Array} rows - Parsed faculty rows
       * @param {Array} existingFaculty - Existing faculty data
       * @returns {Object} Validation result with valid and invalid rows
       */
      validateFaculty: function(rows, existingFaculty) {
        var validRows = [];
        var invalidRows = [];
        var existingEmails = {};

        // Build existing email index
        for (var i = 0; i < existingFaculty.length; i++) {
          var email = existingFaculty[i].data.Email.toLowerCase();
          existingEmails[email] = true;
        }

        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var errors = [];
          var warnings = [];

          // Validate required fields
          if (!row.parsed.name || row.parsed.name.trim().length === 0) {
            errors.push('Name is required');
          }

          if (!row.parsed.email || row.parsed.email.trim().length === 0) {
            errors.push('Email is required');
          } else if (!this._isValidEmail(row.parsed.email)) {
            errors.push('Invalid email format');
          } else if (existingEmails[row.parsed.email.toLowerCase()]) {
            errors.push('Email already exists in system');
          }

          if (!row.parsed.department || row.parsed.department.trim().length === 0) {
            warnings.push('Department is empty');
          }

          // Validate role
          if (row.parsed.role) {
            var validRoles = ['Admin', 'Faculty', 'admin', 'faculty'];
            if (validRoles.indexOf(row.parsed.role) === -1) {
              warnings.push('Role should be "Admin" or "Faculty", defaulting to "Faculty"');
              row.parsed.role = 'Faculty';
            }
          }

          // Validate phone
          if (row.parsed.phone && !this._isValidPhone(row.parsed.phone)) {
            warnings.push('Phone number format may be invalid');
          }

          // Update row with validation results
          row.validation.errors = errors;
          row.validation.warnings = warnings;
          row.isValid = errors.length === 0;

          if (row.isValid) {
            validRows.push(row);
          } else {
            invalidRows.push(row);
          }
        }

        logger.info('Faculty validation completed', {
          total: rows.length,
          valid: validRows.length,
          invalid: invalidRows.length
        });

        return {
          validRows: validRows,
          invalidRows: invalidRows,
          totalRows: rows.length,
          validCount: validRows.length,
          invalidCount: invalidRows.length
        };
      },

      /**
       * Validate event rows
       * @param {Array} rows - Parsed event rows
       * @param {Array} existingFaculty - Existing faculty data
       * @param {Array} existingSchedules - Existing schedule data
       * @returns {Object} Validation result with valid and invalid rows
       */
      validateEvents: function(rows, existingFaculty, existingSchedules) {
        var validRows = [];
        var invalidRows = [];
        var fuzzyMatcher = FuzzyMatcher.getInstance();

        // Pre-process existing schedules for overlap detection
        var scheduleIndex = this._buildScheduleIndex(existingSchedules);

        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var errors = [];
          var warnings = [];

          // Validate faculty name
          if (!row.parsed.facultyName || row.parsed.facultyName.trim().length === 0) {
            errors.push('Faculty name is required');
          } else {
            var matchResult = fuzzyMatcher.matchFaculty(row.parsed.facultyName, existingFaculty, 85);

            if (!matchResult.matched) {
              errors.push('Faculty not found: ' + row.parsed.facultyName);
            } else if (matchResult.confidence < 100) {
              warnings.push('Faculty name fuzzy match (' + matchResult.confidence + '% confidence): ' +
                          matchResult.matchedFaculty.data.Name);
              row.facultyMatch = matchResult;
            } else {
              row.facultyMatch = matchResult;
            }
          }

          // Validate date
          if (!row.parsed.date) {
            errors.push('Date is required');
          } else if (row.dateAmbiguous) {
            warnings.push('Date format is ambiguous: ' + row.parsed.dateOriginal +
                        ' - Please clarify format');
            row.requiresDateConfirmation = true;
          } else if (row.dateFormat === 'UNKNOWN') {
            errors.push('Unable to parse date: ' + row.parsed.dateOriginal);
          }

          // Validate times
          if (!row.parsed.startTime || row.parsed.startTime.trim().length === 0) {
            errors.push('Start time is required');
          } else if (!this._isValidTime(row.parsed.startTime)) {
            errors.push('Invalid start time format: ' + row.parsed.startTime);
          }

          if (!row.parsed.endTime || row.parsed.endTime.trim().length === 0) {
            errors.push('End time is required');
          } else if (!this._isValidTime(row.parsed.endTime)) {
            errors.push('Invalid end time format: ' + row.parsed.endTime);
          }

          // Check time logic
          if (row.parsed.startTime && row.parsed.endTime &&
              this._isValidTime(row.parsed.startTime) && this._isValidTime(row.parsed.endTime)) {
            if (!this._isEndTimeAfterStartTime(row.parsed.startTime, row.parsed.endTime)) {
              errors.push('End time must be after start time');
            }
          }

          // Validate location
          if (!row.parsed.location || row.parsed.location.trim().length === 0) {
            warnings.push('Location is empty');
          }

          // Check for time overlaps (only if we have valid data)
          if (row.facultyMatch && row.facultyMatch.matched && row.parsed.date &&
              this._isValidTime(row.parsed.startTime) && this._isValidTime(row.parsed.endTime)) {

            var facultyId = row.facultyMatch.matchedFaculty.data.FacultyID;
            var overlaps = this._checkTimeOverlap(
              facultyId,
              row.parsed.date,
              row.parsed.startTime,
              row.parsed.endTime,
              scheduleIndex
            );

            if (overlaps.length > 0) {
              errors.push('Time overlap detected with existing schedule(s)');
              row.overlaps = overlaps;
            }
          }

          // Update row with validation results
          row.validation.errors = errors;
          row.validation.warnings = warnings;
          row.isValid = errors.length === 0;

          if (row.isValid) {
            validRows.push(row);
          } else {
            invalidRows.push(row);
          }
        }

        logger.info('Event validation completed', {
          total: rows.length,
          valid: validRows.length,
          invalid: invalidRows.length
        });

        return {
          validRows: validRows,
          invalidRows: invalidRows,
          totalRows: rows.length,
          validCount: validRows.length,
          invalidCount: invalidRows.length
        };
      },

      /**
       * Build schedule index for fast overlap detection
       * @param {Array} schedules - Existing schedules
       * @returns {Object} Index by facultyId and date
       */
      _buildScheduleIndex: function(schedules) {
        var index = {};

        for (var i = 0; i < schedules.length; i++) {
          var sched = schedules[i].data;
          var facultyId = sched.FacultyID;
          var date = sched.Date;

          if (!index[facultyId]) {
            index[facultyId] = {};
          }

          if (!index[facultyId][date]) {
            index[facultyId][date] = [];
          }

          index[facultyId][date].push({
            startTime: sched.StartTime,
            endTime: sched.EndTime,
            location: sched.Location,
            scheduleId: sched.ScheduleID
          });
        }

        return index;
      },

      /**
       * Check for time overlaps
       * @param {string} facultyId - Faculty ID
       * @param {string} date - Date string
       * @param {string} startTime - Start time
       * @param {string} endTime - End time
       * @param {Object} scheduleIndex - Pre-built schedule index
       * @returns {Array} Array of overlapping schedules
       */
      _checkTimeOverlap: function(facultyId, date, startTime, endTime, scheduleIndex) {
        if (!scheduleIndex[facultyId] || !scheduleIndex[facultyId][date]) {
          return [];
        }

        var existingSchedules = scheduleIndex[facultyId][date];
        var overlaps = [];

        var newStart = this._timeToMinutes(startTime);
        var newEnd = this._timeToMinutes(endTime);

        for (var i = 0; i < existingSchedules.length; i++) {
          var existing = existingSchedules[i];
          var existingStart = this._timeToMinutes(existing.startTime);
          var existingEnd = this._timeToMinutes(existing.endTime);

          // Check for overlap
          if (newStart < existingEnd && newEnd > existingStart) {
            overlaps.push(existing);
          }
        }

        return overlaps;
      },

      /**
       * Convert time string to minutes since midnight
       * @param {string} timeStr - Time string (HH:MM or HH:MM AM/PM)
       * @returns {number} Minutes since midnight
       */
      _timeToMinutes: function(timeStr) {
        var match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!match) return 0;

        var hours = parseInt(match[1], 10);
        var minutes = parseInt(match[2], 10);
        var period = match[3] ? match[3].toUpperCase() : null;

        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        return hours * 60 + minutes;
      },

      /**
       * Validate email format
       * @param {string} email - Email to validate
       * @returns {boolean} True if valid
       */
      _isValidEmail: function(email) {
        var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
      },

      /**
       * Validate phone format
       * @param {string} phone - Phone to validate
       * @returns {boolean} True if valid
       */
      _isValidPhone: function(phone) {
        // Very permissive - just check it has some digits
        var digits = phone.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
      },

      /**
       * Validate time format
       * @param {string} timeStr - Time string
       * @returns {boolean} True if valid
       */
      _isValidTime: function(timeStr) {
        // Support HH:MM or HH:MM AM/PM
        var pattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])\s*(AM|PM)?$/i;
        return pattern.test(timeStr);
      },

      /**
       * Check if end time is after start time
       * @param {string} startTime - Start time
       * @param {string} endTime - End time
       * @returns {boolean} True if end is after start
       */
      _isEndTimeAfterStartTime: function(startTime, endTime) {
        var startMinutes = this._timeToMinutes(startTime);
        var endMinutes = this._timeToMinutes(endTime);
        return endMinutes > startMinutes;
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
