/**
 * BulkUploadService - Handles bulk upload of faculty and events with validation
 * Provides parsing, fuzzy matching, date validation, and conflict detection
 */
var BulkUploadService = (function() {
  'use strict';

  var instance = null;

  function BulkUploadServiceClass() {
    this.sheetManager = null;
  }

  /**
   * Initialize the service
   */
  BulkUploadServiceClass.prototype.init = function() {
    this.sheetManager = SheetManager.getInstance();
  };

  /**
   * Parse pasted table data into rows and columns
   * Supports tab-delimited (from Word) and comma-separated values
   * SECURITY: Sanitizes all input to prevent XSS attacks
   * @param {string} rawData - Pasted table data
   * @return {Object} Parsed result with headers and rows
   */
  BulkUploadServiceClass.prototype.parseTableData = function(rawData) {
    try {
      if (!rawData || rawData.trim().length === 0) {
        return { headers: [], rows: [], error: 'No data provided' };
      }

      var lines = rawData.trim().split('\n');
      if (lines.length < 2) {
        return { headers: [], rows: [], error: 'Need at least header row and one data row' };
      }

      // Detect delimiter (tab or comma)
      var delimiter = '\t';
      if (lines[0].indexOf('\t') === -1 && lines[0].indexOf(',') > -1) {
        delimiter = ',';
      }

      // Parse headers with sanitization
      var headers = lines[0].split(delimiter).map(function(h) {
        var cleaned = h.trim().replace(/["\r]/g, '');
        return SecurityUtils.sanitizeInput(cleaned);
      });

      var rows = [];
      for (var i = 1; i < lines.length; i++) {
        if (lines[i].trim().length === 0) continue;

        var cells = lines[i].split(delimiter).map(function(c) {
          var cleaned = c.trim().replace(/["\r]/g, '');
          return SecurityUtils.sanitizeInput(cleaned);
        });

        if (cells.length > 0 && cells[0].length > 0) {
          rows.push(cells);
        }
      }

      Logger.info('Parsed table data', {
        headerCount: headers.length,
        rowCount: rows.length
      });

      return { headers: headers, rows: rows, error: null };
    } catch (e) {
      Logger.error('Failed to parse table data', { error: e.toString() });
      return { headers: [], rows: [], error: e.toString() };
    }
  };

  /**
   * Validate and parse a date string
   * Detects ambiguous dates (01/02/2024 could be Jan 2 or Feb 1)
   * @param {string} dateStr - Date string to parse
   * @return {Object} { date: Date|null, isAmbiguous: boolean, error: string|null }
   */
  BulkUploadServiceClass.prototype.parseDate = function(dateStr) {
    if (!dateStr || dateStr.trim().length === 0) {
      return { date: null, isAmbiguous: false, error: 'Empty date' };
    }

    dateStr = dateStr.trim();

    try {
      // Try ISO format first (unambiguous): 2024-02-01
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        var date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return { date: date, isAmbiguous: false, error: null };
        }
      }

      // Check for ambiguous formats like MM/DD/YYYY or DD/MM/YYYY
      var slashMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (slashMatch) {
        var part1 = parseInt(slashMatch[1]);
        var part2 = parseInt(slashMatch[2]);
        var year = parseInt(slashMatch[3]);

        // Unambiguous if day > 12 or month > 12
        var isAmbiguous = (part1 <= 12 && part2 <= 12);

        // Default to MM/DD/YYYY for US format
        var date = new Date(year, part1 - 1, part2);

        if (isNaN(date.getTime())) {
          return { date: null, isAmbiguous: false, error: 'Invalid date' };
        }

        return {
          date: date,
          isAmbiguous: isAmbiguous,
          error: null,
          note: isAmbiguous ? 'Ambiguous format (MM/DD or DD/MM)' : null
        };
      }

      // Try text formats: "January 15, 2024", "15-Jan-2024"
      var textDate = new Date(dateStr);
      if (!isNaN(textDate.getTime())) {
        return { date: textDate, isAmbiguous: false, error: null };
      }

      return { date: null, isAmbiguous: false, error: 'Unrecognized date format' };
    } catch (e) {
      return { date: null, isAmbiguous: false, error: e.toString() };
    }
  };

  /**
   * Calculate Levenshtein distance between two strings (for fuzzy matching)
   * @param {string} a - First string
   * @param {string} b - Second string
   * @return {number} Edit distance
   */
  BulkUploadServiceClass.prototype.levenshteinDistance = function(a, b) {
    if (!a || !b) return Math.max(a ? a.length : 0, b ? b.length : 0);

    var matrix = [];
    for (var i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (var j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  /**
   * Calculate similarity score (0-100) between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @return {number} Similarity percentage (0-100)
   */
  BulkUploadServiceClass.prototype.calculateSimilarity = function(str1, str2) {
    if (!str1 || !str2) return 0;

    var s1 = str1.toLowerCase().trim();
    var s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 100;

    var maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 100;

    var distance = this.levenshteinDistance(s1, s2);
    return Math.round((1 - distance / maxLen) * 100);
  };

  /**
   * Find matching faculty by name using fuzzy matching
   * @param {string} inputName - Name to match (can be "Dr. John", "John Smith", etc.)
   * @param {number} minConfidence - Minimum confidence threshold (default 85)
   * @return {Array} Array of matches with {faculty, confidence, email}
   */
  BulkUploadServiceClass.prototype.findMatchingFaculty = function(inputName, minConfidence) {
    try {
      minConfidence = minConfidence || 85;

      var allFaculty = this.sheetManager.queryRows('Faculty', function(row) {
        return row.Status === 'Active';
      });

      var matches = [];
      var cleanInput = inputName.toLowerCase().trim()
        .replace(/^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s*/i, '');

      for (var i = 0; i < allFaculty.length; i++) {
        var faculty = allFaculty[i];
        var cleanName = faculty.Name.toLowerCase().trim()
          .replace(/^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s*/i, '');

        // Check full name match
        var fullScore = this.calculateSimilarity(cleanInput, cleanName);

        // Check partial matches (first name, last name)
        var inputParts = cleanInput.split(/\s+/);
        var nameParts = cleanName.split(/\s+/);

        var partialScore = 0;
        for (var j = 0; j < inputParts.length; j++) {
          for (var k = 0; k < nameParts.length; k++) {
            var score = this.calculateSimilarity(inputParts[j], nameParts[k]);
            if (score > partialScore) {
              partialScore = score;
            }
          }
        }

        var confidence = Math.max(fullScore, partialScore);

        if (confidence >= minConfidence) {
          matches.push({
            faculty: faculty,
            confidence: confidence,
            email: faculty.Email,
            name: faculty.Name
          });
        }
      }

      // Sort by confidence descending
      matches.sort(function(a, b) { return b.confidence - a.confidence; });

      Logger.debug('Faculty fuzzy match', {
        inputName: inputName,
        matchCount: matches.length,
        topConfidence: matches.length > 0 ? matches[0].confidence : 0
      });

      return matches;
    } catch (e) {
      Logger.error('Failed to find matching faculty', {
        error: e.toString(),
        inputName: inputName
      });
      return [];
    }
  };

  /**
   * Validate a faculty data row
   * SECURITY: Validates and sanitizes all input, checks for XSS attempts
   * @param {Array} row - Row data array
   * @param {Array} headers - Header names
   * @return {Object} Validation result
   */
  BulkUploadServiceClass.prototype.validateFacultyRow = function(row, headers) {
    var errors = [];
    var warnings = [];
    var rowObj = {};

    // Map row to object with sanitization
    for (var i = 0; i < headers.length; i++) {
      var rawValue = row[i] || '';
      rowObj[headers[i]] = rawValue;
    }

    // Validate and sanitize Email
    if (!rowObj.Email || rowObj.Email.trim().length === 0) {
      errors.push('Email is required');
    } else {
      var emailValidation = SecurityUtils.validateInput(rowObj.Email, {
        required: true,
        isEmail: true,
        maxLength: 255
      });
      if (!emailValidation.isValid) {
        errors = errors.concat(emailValidation.errors);
      }
      rowObj.Email = emailValidation.sanitized;
    }

    // Validate and sanitize Name
    if (!rowObj.Name || rowObj.Name.trim().length === 0) {
      errors.push('Name is required');
    } else {
      var nameValidation = SecurityUtils.validateInput(rowObj.Name, {
        required: true,
        maxLength: 255
      });
      if (!nameValidation.isValid) {
        errors = errors.concat(nameValidation.errors);
        AuditService.getInstance().logInputValidationFailure('Name', nameValidation.errors.join(', '), {
          value: rowObj.Name.substring(0, 50)
        });
      }
      rowObj.Name = nameValidation.sanitized;
    }

    // Validate and sanitize Role
    if (!rowObj.Role || rowObj.Role.trim().length === 0) {
      errors.push('Role is required');
    } else {
      rowObj.Role = SecurityUtils.sanitizeInput(rowObj.Role);
      if (rowObj.Role !== 'Admin' && rowObj.Role !== 'Faculty') {
        errors.push('Role must be "Admin" or "Faculty"');
      }
    }

    // Sanitize optional fields
    if (rowObj.Department) {
      rowObj.Department = SecurityUtils.sanitizeInput(rowObj.Department);
    }
    if (rowObj.ContactNumber) {
      rowObj.ContactNumber = SecurityUtils.sanitizeInput(rowObj.ContactNumber);
    }
    if (rowObj.Status) {
      rowObj.Status = SecurityUtils.sanitizeInput(rowObj.Status);
    }

    // Check for duplicates only if email is valid
    if (errors.length === 0) {
      var existing = this.sheetManager.findRow('Faculty', { Email: rowObj.Email });
      if (existing) {
        errors.push('Email already exists in system');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      data: rowObj
    };
  };

  /**
   * Validate an event data row
   * SECURITY: Validates and sanitizes all input, checks for XSS attempts
   * @param {Array} row - Row data array
   * @param {Array} headers - Header names
   * @return {Object} Validation result
   */
  BulkUploadServiceClass.prototype.validateEventRow = function(row, headers) {
    var errors = [];
    var warnings = [];
    var rowObj = {};

    // Map row to object with sanitization
    for (var i = 0; i < headers.length; i++) {
      var rawValue = row[i] || '';
      rowObj[headers[i]] = SecurityUtils.sanitizeInput(rawValue);
    }

    // Validate faculty email or name
    var facultyMatches = [];
    if (!rowObj.FacultyEmail && !rowObj.FacultyName) {
      errors.push('FacultyEmail or FacultyName is required');
    } else {
      if (rowObj.FacultyEmail) {
        var faculty = this.sheetManager.findRow('Faculty', {
          Email: rowObj.FacultyEmail.trim()
        });
        if (!faculty) {
          errors.push('Faculty email not found: ' + rowObj.FacultyEmail);
        } else {
          rowObj._matchedEmail = faculty.Email;
        }
      } else if (rowObj.FacultyName) {
        facultyMatches = this.findMatchingFaculty(rowObj.FacultyName);
        if (facultyMatches.length === 0) {
          errors.push('No matching faculty found for: ' + rowObj.FacultyName);
        } else if (facultyMatches.length === 1) {
          rowObj._matchedEmail = facultyMatches[0].email;
          rowObj._matchConfidence = facultyMatches[0].confidence;
          warnings.push('Matched to: ' + facultyMatches[0].name + ' (' + facultyMatches[0].confidence + '%)');
        } else {
          rowObj._facultyMatches = facultyMatches;
          warnings.push('Multiple matches found - need manual selection');
        }
      }
    }

    // Validate dates
    if (!rowObj.StartDateTime) {
      errors.push('StartDateTime is required');
    } else {
      var startResult = this.parseDate(rowObj.StartDateTime);
      if (startResult.error) {
        errors.push('Invalid StartDateTime: ' + startResult.error);
      } else {
        rowObj._parsedStartDate = startResult.date;
        if (startResult.isAmbiguous) {
          warnings.push('Ambiguous start date format - please confirm');
          rowObj._startDateAmbiguous = true;
        }
      }
    }

    if (!rowObj.EndDateTime) {
      errors.push('EndDateTime is required');
    } else {
      var endResult = this.parseDate(rowObj.EndDateTime);
      if (endResult.error) {
        errors.push('Invalid EndDateTime: ' + endResult.error);
      } else {
        rowObj._parsedEndDate = endResult.date;
        if (endResult.isAmbiguous) {
          warnings.push('Ambiguous end date format - please confirm');
          rowObj._endDateAmbiguous = true;
        }
      }
    }

    // Validate time range
    if (rowObj._parsedStartDate && rowObj._parsedEndDate) {
      if (rowObj._parsedEndDate <= rowObj._parsedStartDate) {
        errors.push('End time must be after start time');
      }
    }

    // Check for time overlaps if we have a matched faculty
    if (rowObj._matchedEmail && rowObj._parsedStartDate && rowObj._parsedEndDate) {
      var overlaps = this.findTimeOverlaps(
        rowObj._matchedEmail,
        rowObj._parsedStartDate,
        rowObj._parsedEndDate
      );
      if (overlaps.length > 0) {
        errors.push('Time overlap with existing event(s)');
        rowObj._overlaps = overlaps;
      }
    }

    // Required fields with validation
    if (!rowObj.EventType || rowObj.EventType.trim().length === 0) {
      errors.push('EventType is required');
    } else {
      var eventTypeValidation = SecurityUtils.validateInput(rowObj.EventType, {
        required: true,
        maxLength: 255
      });
      if (!eventTypeValidation.isValid) {
        errors = errors.concat(eventTypeValidation.errors);
        AuditService.getInstance().logInputValidationFailure('EventType', eventTypeValidation.errors.join(', '), {
          value: rowObj.EventType.substring(0, 50)
        });
      }
    }

    // Validate optional text fields
    if (rowObj.Location) {
      var locationValidation = SecurityUtils.validateInput(rowObj.Location, { maxLength: 500 });
      if (!locationValidation.isValid) {
        errors = errors.concat(locationValidation.errors);
      }
    }

    if (rowObj.Description) {
      var descValidation = SecurityUtils.validateInput(rowObj.Description, { maxLength: 2000 });
      if (!descValidation.isValid) {
        errors = errors.concat(descValidation.errors);
      }
    }

    return {
      valid: errors.length === 0 && warnings.filter(function(w) {
        return w.indexOf('Multiple matches') > -1 || w.indexOf('Ambiguous') > -1;
      }).length === 0,
      errors: errors,
      warnings: warnings,
      data: rowObj
    };
  };

  /**
   * Find time overlaps for a faculty member
   * @param {string} facultyEmail - Faculty email
   * @param {Date} startDate - Start date/time
   * @param {Date} endDate - End date/time
   * @return {Array} Array of overlapping events
   */
  BulkUploadServiceClass.prototype.findTimeOverlaps = function(facultyEmail, startDate, endDate) {
    try {
      var events = this.sheetManager.queryRows('Schedule', function(row) {
        return row.FacultyEmail === facultyEmail && row.Status === 'Active';
      });

      var overlaps = [];
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var eventStart = new Date(event.StartDateTime);
        var eventEnd = new Date(event.EndDateTime);

        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        if (startDate < eventEnd && endDate > eventStart) {
          overlaps.push({
            eventId: event.EventID,
            eventType: event.EventType,
            start: eventStart,
            end: eventEnd
          });
        }
      }

      return overlaps;
    } catch (e) {
      Logger.error('Failed to check time overlaps', { error: e.toString() });
      return [];
    }
  };

  /**
   * Preview bulk upload data with validation
   * @param {string} rawData - Pasted table data
   * @param {string} dataType - 'faculty' or 'events'
   * @return {Object} Preview result with validation
   */
  BulkUploadServiceClass.prototype.previewBulkUpload = function(rawData, dataType) {
    try {
      var startTime = new Date().getTime();

      var parsed = this.parseTableData(rawData);
      if (parsed.error) {
        return {
          success: false,
          error: parsed.error,
          parseTime: new Date().getTime() - startTime
        };
      }

      var validatedRows = [];
      var validCount = 0;
      var invalidCount = 0;

      for (var i = 0; i < parsed.rows.length; i++) {
        var validation;
        if (dataType === 'faculty') {
          validation = this.validateFacultyRow(parsed.rows[i], parsed.headers);
        } else if (dataType === 'events') {
          validation = this.validateEventRow(parsed.rows[i], parsed.headers);
        } else {
          return { success: false, error: 'Invalid data type: ' + dataType };
        }

        validatedRows.push({
          rowNumber: i + 1,
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          data: validation.data,
          rawData: parsed.rows[i]
        });

        if (validation.valid) {
          validCount++;
        } else {
          invalidCount++;
        }
      }

      var parseTime = new Date().getTime() - startTime;

      Logger.info('Bulk upload preview generated', {
        dataType: dataType,
        totalRows: parsed.rows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        parseTime: parseTime + 'ms'
      });

      return {
        success: true,
        headers: parsed.headers,
        rows: validatedRows,
        summary: {
          total: parsed.rows.length,
          valid: validCount,
          invalid: invalidCount,
          parseTime: parseTime
        }
      };
    } catch (e) {
      Logger.error('Failed to preview bulk upload', { error: e.toString() });
      return { success: false, error: e.toString() };
    }
  };

  /**
   * Commit validated rows to the database
   * @param {Array} validatedRows - Array of validated row objects
   * @param {string} dataType - 'faculty' or 'events'
   * @return {Object} Commit result
   */
  BulkUploadServiceClass.prototype.commitBulkUpload = function(validatedRows, dataType) {
    try {
      var successCount = 0;
      var failureCount = 0;
      var results = [];

      for (var i = 0; i < validatedRows.length; i++) {
        var row = validatedRows[i];

        if (!row.valid) {
          failureCount++;
          results.push({
            rowNumber: row.rowNumber,
            success: false,
            reason: row.errors.join(', ')
          });
          continue;
        }

        try {
          if (dataType === 'faculty') {
            var facultyData = [
              row.data.Email,
              row.data.Name,
              row.data.Role,
              row.data.Department || '',
              row.data.ContactNumber || '',
              row.data.Status || 'Active'
            ];
            this.sheetManager.appendRow('Faculty', facultyData);
          } else if (dataType === 'events') {
            var eventId = 'EVT-' + new Date().getTime() + '-' + i;
            var eventData = [
              eventId,
              row.data._matchedEmail || row.data.FacultyEmail,
              row.data.EventType,
              row.data._parsedStartDate ? row.data._parsedStartDate.toISOString() : row.data.StartDateTime,
              row.data._parsedEndDate ? row.data._parsedEndDate.toISOString() : row.data.EndDateTime,
              row.data.Location || '',
              row.data.Description || '',
              'Active',
              '' // CalendarEventID
            ];
            this.sheetManager.appendRow('Schedule', eventData);
          }

          successCount++;
          results.push({
            rowNumber: row.rowNumber,
            success: true,
            reason: null
          });
        } catch (e) {
          failureCount++;
          results.push({
            rowNumber: row.rowNumber,
            success: false,
            reason: e.toString()
          });
        }
      }

      Logger.info('Bulk upload committed', {
        dataType: dataType,
        totalRows: validatedRows.length,
        successCount: successCount,
        failureCount: failureCount
      });

      return {
        success: true,
        summary: {
          total: validatedRows.length,
          successful: successCount,
          failed: failureCount
        },
        results: results
      };
    } catch (e) {
      Logger.error('Failed to commit bulk upload', { error: e.toString() });
      return { success: false, error: e.toString() };
    }
  };

  /**
   * Get singleton instance
   */
  function getInstance() {
    if (!instance) {
      instance = new BulkUploadServiceClass();
      instance.init();
    }
    return instance;
  }

  return {
    getInstance: getInstance
  };
})();
