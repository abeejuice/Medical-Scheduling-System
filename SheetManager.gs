/**
 * SheetManager - Singleton for managing Google Sheets data operations
 * Provides append, update, and query functionality for all sheets
 */
var SheetManager = (function() {
  var instance;
  var logger = Logger.getInstance();

  function createInstance() {
    return {
      /**
       * Get the active spreadsheet
       * @returns {Spreadsheet}
       */
      getSpreadsheet: function() {
        try {
          return SpreadsheetApp.getActiveSpreadsheet();
        } catch (e) {
          logger.error('Failed to get active spreadsheet', { error: e.toString() });
          throw new Error('Unable to access spreadsheet: ' + e.toString());
        }
      },

      /**
       * Get a sheet by name
       * @param {string} sheetName - Name of the sheet
       * @returns {Sheet}
       */
      getSheet: function(sheetName) {
        try {
          var ss = this.getSpreadsheet();
          var sheet = ss.getSheetByName(sheetName);

          if (!sheet) {
            logger.error('Sheet not found', { sheetName: sheetName });
            throw new Error('Sheet "' + sheetName + '" not found');
          }

          return sheet;
        } catch (e) {
          logger.error('Failed to get sheet', { sheetName: sheetName, error: e.toString() });
          throw e;
        }
      },

      /**
       * Append a row to a sheet
       * @param {string} sheetName - Name of the sheet
       * @param {Array} rowData - Array of values to append
       * @returns {number} Row number of appended row
       */
      appendRow: function(sheetName, rowData) {
        try {
          var sheet = this.getSheet(sheetName);
          sheet.appendRow(rowData);
          var lastRow = sheet.getLastRow();

          logger.info('Row appended successfully', {
            sheetName: sheetName,
            rowNumber: lastRow,
            columnCount: rowData.length
          });

          return lastRow;
        } catch (e) {
          logger.error('Failed to append row', {
            sheetName: sheetName,
            error: e.toString()
          });
          throw new Error('Failed to append row to ' + sheetName + ': ' + e.toString());
        }
      },

      /**
       * Update a specific cell or range
       * @param {string} sheetName - Name of the sheet
       * @param {number} row - Row number (1-indexed)
       * @param {number} col - Column number (1-indexed)
       * @param {*} value - Value to set
       */
      updateCell: function(sheetName, row, col, value) {
        try {
          var sheet = this.getSheet(sheetName);
          sheet.getRange(row, col).setValue(value);

          logger.info('Cell updated successfully', {
            sheetName: sheetName,
            row: row,
            col: col
          });
        } catch (e) {
          logger.error('Failed to update cell', {
            sheetName: sheetName,
            row: row,
            col: col,
            error: e.toString()
          });
          throw new Error('Failed to update cell: ' + e.toString());
        }
      },

      /**
       * Update an entire row
       * @param {string} sheetName - Name of the sheet
       * @param {number} rowNumber - Row number (1-indexed)
       * @param {Array} rowData - Array of values
       */
      updateRow: function(sheetName, rowNumber, rowData) {
        try {
          var sheet = this.getSheet(sheetName);
          var range = sheet.getRange(rowNumber, 1, 1, rowData.length);
          range.setValues([rowData]);

          logger.info('Row updated successfully', {
            sheetName: sheetName,
            rowNumber: rowNumber,
            columnCount: rowData.length
          });
        } catch (e) {
          logger.error('Failed to update row', {
            sheetName: sheetName,
            rowNumber: rowNumber,
            error: e.toString()
          });
          throw new Error('Failed to update row: ' + e.toString());
        }
      },

      /**
       * Query rows based on column value match
       * @param {string} sheetName - Name of the sheet
       * @param {number} columnIndex - Column index to search (1-indexed)
       * @param {*} value - Value to match
       * @returns {Array} Array of matching row objects with rowNumber and data
       */
      queryByColumn: function(sheetName, columnIndex, value) {
        try {
          var sheet = this.getSheet(sheetName);
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var results = [];

          for (var i = 1; i < data.length; i++) {
            if (data[i][columnIndex - 1] === value) {
              var rowObj = { rowNumber: i + 1, data: {} };
              for (var j = 0; j < headers.length; j++) {
                rowObj.data[headers[j]] = data[i][j];
              }
              results.push(rowObj);
            }
          }

          logger.info('Query completed', {
            sheetName: sheetName,
            columnIndex: columnIndex,
            resultsCount: results.length
          });

          return results;
        } catch (e) {
          logger.error('Failed to query rows', {
            sheetName: sheetName,
            columnIndex: columnIndex,
            error: e.toString()
          });
          throw new Error('Failed to query rows: ' + e.toString());
        }
      },

      /**
       * Get all rows from a sheet as objects
       * @param {string} sheetName - Name of the sheet
       * @returns {Array} Array of row objects
       */
      getAllRows: function(sheetName) {
        try {
          var sheet = this.getSheet(sheetName);
          var data = sheet.getDataRange().getValues();

          if (data.length < 2) {
            return [];
          }

          var headers = data[0];
          var results = [];

          for (var i = 1; i < data.length; i++) {
            var rowObj = { rowNumber: i + 1, data: {} };
            for (var j = 0; j < headers.length; j++) {
              rowObj.data[headers[j]] = data[i][j];
            }
            results.push(rowObj);
          }

          logger.info('Retrieved all rows', {
            sheetName: sheetName,
            rowCount: results.length
          });

          return results;
        } catch (e) {
          logger.error('Failed to get all rows', {
            sheetName: sheetName,
            error: e.toString()
          });
          throw new Error('Failed to get all rows: ' + e.toString());
        }
      },

      /**
       * Find row by matching multiple criteria
       * @param {string} sheetName - Name of the sheet
       * @param {Object} criteria - Object with column names and values to match
       * @returns {Object|null} First matching row object or null
       */
      findRow: function(sheetName, criteria) {
        try {
          var sheet = this.getSheet(sheetName);
          var data = sheet.getDataRange().getValues();
          var headers = data[0];

          for (var i = 1; i < data.length; i++) {
            var match = true;
            for (var key in criteria) {
              var colIndex = headers.indexOf(key);
              if (colIndex === -1 || data[i][colIndex] !== criteria[key]) {
                match = false;
                break;
              }
            }

            if (match) {
              var rowObj = { rowNumber: i + 1, data: {} };
              for (var j = 0; j < headers.length; j++) {
                rowObj.data[headers[j]] = data[i][j];
              }
              return rowObj;
            }
          }

          return null;
        } catch (e) {
          logger.error('Failed to find row', {
            sheetName: sheetName,
            criteria: criteria,
            error: e.toString()
          });
          throw new Error('Failed to find row: ' + e.toString());
        }
      },

      /**
       * Delete a row
       * @param {string} sheetName - Name of the sheet
       * @param {number} rowNumber - Row number to delete (1-indexed)
       */
      deleteRow: function(sheetName, rowNumber) {
        try {
          var sheet = this.getSheet(sheetName);
          sheet.deleteRow(rowNumber);

          logger.info('Row deleted successfully', {
            sheetName: sheetName,
            rowNumber: rowNumber
          });
        } catch (e) {
          logger.error('Failed to delete row', {
            sheetName: sheetName,
            rowNumber: rowNumber,
            error: e.toString()
          });
          throw new Error('Failed to delete row: ' + e.toString());
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
