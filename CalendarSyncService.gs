/**
 * CalendarSyncService - Automated calendar synchronization
 * Syncs Schedule sheet data with Google Calendar
 * Runs daily via time-based trigger
 */
var CalendarSyncService = (function() {
  'use strict';

  var instance = null;

  function CalendarSyncServiceClass() {
    this.sheetManager = null;
    this.auditService = null;
    this.calendarId = null;
  }

  /**
   * Initialize the service
   */
  CalendarSyncServiceClass.prototype.init = function() {
    this.sheetManager = SheetManager.getInstance();
    this.auditService = AuditService.getInstance();

    // Use primary calendar by default
    // In production, you might want to use a dedicated calendar
    this.calendarId = 'primary';
  };

  /**
   * Sync all schedules to Google Calendar
   * This is the main function called by the daily trigger
   * @return {Object} Sync result summary
   */
  CalendarSyncServiceClass.prototype.syncAllCalendars = function() {
    var startTime = new Date();
    var summary = {
      success: true,
      totalEvents: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      Logger.info('Starting calendar sync');
      this.auditService.logEvent('CALENDAR_SYNC', 'Starting automated calendar sync', {});

      // Get all active schedule events
      var scheduleEvents = this.sheetManager.queryRows('Schedule', function(row) {
        return row.Status === 'Active';
      });

      summary.totalEvents = scheduleEvents.length;
      Logger.info('Found ' + scheduleEvents.length + ' active schedule events');

      // Process each event
      for (var i = 0; i < scheduleEvents.length; i++) {
        try {
          var scheduleEvent = scheduleEvents[i];
          var syncResult = this.syncEvent(scheduleEvent);

          if (syncResult.success) {
            if (syncResult.action === 'created') {
              summary.created++;
            } else if (syncResult.action === 'updated') {
              summary.updated++;
            }
          } else {
            summary.errors++;
            summary.errorDetails.push({
              eventId: scheduleEvent.EventID,
              error: syncResult.error
            });
          }
        } catch (e) {
          summary.errors++;
          summary.errorDetails.push({
            eventId: scheduleEvents[i].EventID,
            error: e.toString(),
            stack: e.stack
          });

          Logger.error('Failed to sync event', {
            eventId: scheduleEvents[i].EventID,
            error: e.toString(),
            stack: e.stack
          });
        }
      }

      // Clean up deleted events
      try {
        var deleteResult = this.cleanupDeletedEvents();
        summary.deleted = deleteResult.deleted;
      } catch (e) {
        Logger.error('Failed to cleanup deleted events', {
          error: e.toString(),
          stack: e.stack
        });
      }

      var duration = (new Date() - startTime) / 1000;
      summary.durationSeconds = duration;

      // Log completion
      this.auditService.logEvent('CALENDAR_SYNC', 'Calendar sync completed', {
        summary: JSON.stringify(summary)
      });

      Logger.info('Calendar sync completed', summary);

      return summary;

    } catch (e) {
      summary.success = false;
      summary.error = e.toString();
      summary.stack = e.stack;

      Logger.critical('Calendar sync failed', {
        error: e.toString(),
        stack: e.stack,
        summary: JSON.stringify(summary)
      });

      this.auditService.logEvent('CALENDAR_SYNC', 'Calendar sync failed', {
        error: e.toString(),
        stack: e.stack
      });

      return summary;
    }
  };

  /**
   * Sync a single schedule event to calendar
   * @param {Object} scheduleEvent - Event from Schedule sheet
   * @return {Object} Sync result
   */
  CalendarSyncServiceClass.prototype.syncEvent = function(scheduleEvent) {
    try {
      var calendar = CalendarApp.getDefaultCalendar();
      var calendarEventId = scheduleEvent.CalendarEventID;

      // Parse dates
      var startDate = new Date(scheduleEvent.StartDateTime);
      var endDate = new Date(scheduleEvent.EndDateTime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
          success: false,
          error: 'Invalid date format'
        };
      }

      // Prepare event details
      var title = scheduleEvent.EventType + ' - ' + scheduleEvent.FacultyEmail;
      var description = 'Medical Scheduling System Event\n\n' +
        'Type: ' + scheduleEvent.EventType + '\n' +
        'Faculty: ' + scheduleEvent.FacultyEmail + '\n' +
        'Location: ' + (scheduleEvent.Location || 'TBD') + '\n' +
        'Description: ' + (scheduleEvent.Description || '') + '\n' +
        'Event ID: ' + scheduleEvent.EventID;

      var location = scheduleEvent.Location || '';

      // Check if calendar event exists
      if (calendarEventId) {
        // Update existing event
        try {
          var existingEvent = calendar.getEventById(calendarEventId);

          if (existingEvent) {
            existingEvent.setTitle(title);
            existingEvent.setDescription(description);
            existingEvent.setLocation(location);
            existingEvent.setTime(startDate, endDate);

            Logger.info('Updated calendar event', {
              eventId: scheduleEvent.EventID,
              calendarEventId: calendarEventId
            });

            return {
              success: true,
              action: 'updated',
              calendarEventId: calendarEventId
            };
          } else {
            // Calendar event was deleted, create new one
            calendarEventId = null;
          }
        } catch (e) {
          // Event not found or error accessing it, create new one
          Logger.warning('Failed to update calendar event, will create new', {
            eventId: scheduleEvent.EventID,
            error: e.toString()
          });
          calendarEventId = null;
        }
      }

      // Create new calendar event
      if (!calendarEventId) {
        var newEvent = calendar.createEvent(title, startDate, endDate, {
          description: description,
          location: location
        });

        var newCalendarEventId = newEvent.getId();

        // Update Schedule sheet with calendar event ID
        this.sheetManager.updateRowByCriteria(
          'Schedule',
          { EventID: scheduleEvent.EventID },
          { CalendarEventID: newCalendarEventId }
        );

        Logger.info('Created calendar event', {
          eventId: scheduleEvent.EventID,
          calendarEventId: newCalendarEventId
        });

        return {
          success: true,
          action: 'created',
          calendarEventId: newCalendarEventId
        };
      }

    } catch (e) {
      Logger.error('Failed to sync event', {
        eventId: scheduleEvent.EventID,
        error: e.toString(),
        stack: e.stack
      });

      return {
        success: false,
        error: e.toString(),
        stack: e.stack
      };
    }
  };

  /**
   * Clean up calendar events for deleted/inactive schedule entries
   * @return {Object} Cleanup result
   */
  CalendarSyncServiceClass.prototype.cleanupDeletedEvents = function() {
    var result = {
      deleted: 0,
      errors: 0
    };

    try {
      var calendar = CalendarApp.getDefaultCalendar();

      // Get inactive schedule events that still have calendar event IDs
      var inactiveEvents = this.sheetManager.queryRows('Schedule', function(row) {
        return row.Status === 'Inactive' && row.CalendarEventID && row.CalendarEventID !== '';
      });

      for (var i = 0; i < inactiveEvents.length; i++) {
        try {
          var scheduleEvent = inactiveEvents[i];
          var calendarEventId = scheduleEvent.CalendarEventID;

          if (calendarEventId) {
            var calendarEvent = calendar.getEventById(calendarEventId);

            if (calendarEvent) {
              calendarEvent.deleteEvent();
              result.deleted++;

              Logger.info('Deleted calendar event', {
                eventId: scheduleEvent.EventID,
                calendarEventId: calendarEventId
              });
            }

            // Clear calendar event ID from Schedule sheet
            this.sheetManager.updateRowByCriteria(
              'Schedule',
              { EventID: scheduleEvent.EventID },
              { CalendarEventID: '' }
            );
          }
        } catch (e) {
          result.errors++;
          Logger.warning('Failed to delete calendar event', {
            eventId: inactiveEvents[i].EventID,
            error: e.toString()
          });
        }
      }

      return result;

    } catch (e) {
      Logger.error('Failed to cleanup deleted events', {
        error: e.toString(),
        stack: e.stack
      });
      throw e;
    }
  };

  /**
   * Get singleton instance
   */
  function getInstance() {
    if (!instance) {
      instance = new CalendarSyncServiceClass();
      instance.init();
    }
    return instance;
  }

  return {
    getInstance: getInstance
  };
})();

/**
 * Global function for daily trigger
 * This function is called by the time-based trigger
 */
function dailyCalendarSync() {
  try {
    Logger.info('Daily calendar sync triggered');

    var syncService = CalendarSyncService.getInstance();
    var result = syncService.syncAllCalendars();

    if (result.success) {
      Logger.info('Daily sync completed successfully', {
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        errors: result.errors
      });
    } else {
      Logger.error('Daily sync completed with errors', {
        error: result.error,
        stack: result.stack,
        summary: JSON.stringify(result)
      });
    }

    return result;
  } catch (e) {
    Logger.critical('Daily calendar sync failed', {
      error: e.toString(),
      stack: e.stack
    });
    throw e;
  }
}

/**
 * Manual sync function for testing
 * Can be called from menu or setup
 */
function syncAllCalendars() {
  try {
    var syncService = CalendarSyncService.getInstance();
    var result = syncService.syncAllCalendars();

    SpreadsheetApp.getUi().alert(
      'Calendar Sync Complete',
      'Created: ' + result.created + '\n' +
      'Updated: ' + result.updated + '\n' +
      'Deleted: ' + result.deleted + '\n' +
      'Errors: ' + result.errors + '\n' +
      'Duration: ' + result.durationSeconds + ' seconds',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return result;
  } catch (e) {
    Logger.error('Manual calendar sync failed', { error: e.toString(), stack: e.stack });
    SpreadsheetApp.getUi().alert('Error', 'Sync failed: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    return { success: false, error: e.toString() };
  }
}
