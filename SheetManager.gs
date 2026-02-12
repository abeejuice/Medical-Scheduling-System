/**
 * SheetManager - Singleton for managing Google Sheets data operations
 * Provides append, update, and query capabilities for all sheets
 */
var SheetManager = (function() {
  'use strict';

  var instance = null;

  // Sheet configuration with column headers
  var SHEET_CONFIG = {
    Faculty: {
      headers: ['Email', 'Name', 'Role', 'Department', 'ContactNumber', 'Status']
    },
    Schedule: {
      headers: ['EventID', 'FacultyEmail', 'EventType', 'StartDateTime', 'EndDateTime', 'Location', 'Description', 'Status', 'CalendarEventID']
    },
    SwapRequests: {
      headers: ['RequestID', 'RequesterEmail', 'TargetEmail', 'EventID', 'RequestDate', 'Status', 'ApproverEmail', 'ApprovalDate', 'Comments']
    },
    AuditLog: {
      headers: ['Timestamp', 'Severity', 'Message', 'Metadata', 'UserEmail']
    }
  };

  function SheetManagerClass() {
    this.spreadsheet = null;
    this.sheets = {};
  }

  /**
   * Initialize the SheetManager with the active spreadsheet
   */
  SheetManagerClass.prototype.init = function() {
    try {
      this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!this.spreadsheet) {
        throw new Error('No active spreadsheet found');
      }

      // Cache sheet references
      for (var sheetName in SHEET_CONFIG) {
        var sheet = this.spreadsheet.getSheetByName(sheetName);
        if (!sheet) {
          Logger.warning('Sheet not found: ' + sheetName);
        } else {
          this.sheets[sheetName] = sheet;
        }
      }

      Logger.info('SheetManager initialized successfully');
      return true;
    } catch (e) {
      Logger.error('Failed to initialize SheetManager', { error: e.toString() });
      throw e;
    }
  };

  /**
   * Get a sheet by name
   * @param {string} sheetName - Name of the sheet
   * @return {Sheet} The sheet object
   */
  SheetManagerClass.prototype.getSheet = function(sheetName) {
    if (!this.sheets[sheetName]) {
      var sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        Logger.error('Sheet not found: ' + sheetName);
        throw new Error('Sheet not found: ' + sheetName);
      }
      this.sheets[sheetName] = sheet;
    }
    return this.sheets[sheetName];
  };

  /**
   * Append a row to a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Array} rowData - Array of values to append
   * @return {number} Row number where data was appended
   */
  SheetManagerClass.prototype.appendRow = function(sheetName, rowData) {
    try {
      var sheet = this.getSheet(sheetName);
      sheet.appendRow(rowData);
      var lastRow = sheet.getLastRow();

      Logger.debug('Row appended to ' + sheetName, {
        rowNumber: lastRow,
        dataLength: rowData.length
      });

      return lastRow;
    } catch (e) {
      Logger.error('Failed to append row to ' + sheetName, {
        error: e.toString(),
        dataLength: rowData ? rowData.length : 0
      });
      throw e;
    }
  };

  /**
   * Update a row in a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {number} rowNumber - Row number to update (1-based)
   * @param {Array} rowData - Array of values to update
   * @return {boolean} Success status
   */
  SheetManagerClass.prototype.updateRow = function(sheetName, rowNumber, rowData) {
    try {
      var sheet = this.getSheet(sheetName);
      var range = sheet.getRange(rowNumber, 1, 1, rowData.length);
      range.setValues([rowData]);

      Logger.debug('Row updated in ' + sheetName, {
        rowNumber: rowNumber,
        dataLength: rowData.length
      });

      return true;
    } catch (e) {
      Logger.error('Failed to update row in ' + sheetName, {
        error: e.toString(),
        rowNumber: rowNumber
      });
      throw e;
    }
  };

  /**
   * Query rows from a sheet with optional filter
   * @param {string} sheetName - Name of the sheet
   * @param {Function} filterFn - Optional filter function (row, index) => boolean
   * @return {Array} Array of row objects with column headers as keys
   */
  SheetManagerClass.prototype.queryRows = function(sheetName, filterFn) {
    try {
      var sheet = this.getSheet(sheetName);
      var data = sheet.getDataRange().getValues();

      if (data.length === 0) {
        return [];
      }

      var headers = data[0];
      var rows = [];

      for (var i = 1; i < data.length; i++) {
        var rowObj = {
          _rowNumber: i + 1,
          _values: data[i]
        };

        for (var j = 0; j < headers.length; j++) {
          rowObj[headers[j]] = data[i][j];
        }

        if (!filterFn || filterFn(rowObj, i)) {
          rows.push(rowObj);
        }
      }

      Logger.debug('Query executed on ' + sheetName, {
        totalRows: data.length - 1,
        matchedRows: rows.length
      });

      return rows;
    } catch (e) {
      Logger.error('Failed to query rows from ' + sheetName, {
        error: e.toString()
      });
      throw e;
    }
  };

  /**
   * Find a single row by criteria
   * @param {string} sheetName - Name of the sheet
   * @param {Object} criteria - Object with column:value pairs to match
   * @return {Object|null} Row object or null if not found
   */
  SheetManagerClass.prototype.findRow = function(sheetName, criteria) {
    try {
      var rows = this.queryRows(sheetName, function(row) {
        for (var key in criteria) {
          if (row[key] !== criteria[key]) {
            return false;
          }
        }
        return true;
      });

      return rows.length > 0 ? rows[0] : null;
    } catch (e) {
      Logger.error('Failed to find row in ' + sheetName, {
        error: e.toString(),
        criteria: JSON.stringify(criteria)
      });
      throw e;
    }
  };

  /**
   * Update a row by criteria
   * @param {string} sheetName - Name of the sheet
   * @param {Object} criteria - Object with column:value pairs to match
   * @param {Object} updates - Object with column:value pairs to update
   * @return {boolean} Success status
   */
  SheetManagerClass.prototype.updateRowByCriteria = function(sheetName, criteria, updates) {
    try {
      var row = this.findRow(sheetName, criteria);
      if (!row) {
        Logger.warning('No row found to update in ' + sheetName, {
          criteria: JSON.stringify(criteria)
        });
        return false;
      }

      var sheet = this.getSheet(sheetName);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

      for (var key in updates) {
        var colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(row._rowNumber, colIndex + 1).setValue(updates[key]);
        }
      }

      Logger.debug('Row updated by criteria in ' + sheetName, {
        rowNumber: row._rowNumber,
        updates: JSON.stringify(updates)
      });

      return true;
    } catch (e) {
      Logger.error('Failed to update row by criteria in ' + sheetName, {
        error: e.toString(),
        criteria: JSON.stringify(criteria)
      });
      throw e;
    }
  };

  /**
   * Get the sheet configuration
   */
  SheetManagerClass.prototype.getSheetConfig = function() {
    return SHEET_CONFIG;
  };

  /**
   * Get singleton instance
   */
  function getInstance() {
    if (!instance) {
      instance = new SheetManagerClass();
      instance.init();
    }
    return instance;
  }

  return {
    getInstance: getInstance
  };
})();
