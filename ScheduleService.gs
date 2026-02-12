/**
 * ScheduleService - Manages schedule access with proper authorization
 * SECURITY: Faculty can only view/modify their own schedule
 */
var ScheduleService = (function() {
  'use strict';

  var instance = null;

  function ScheduleServiceClass() {
    this.sheetManager = null;
    this.authService = null;
    this.auditService = null;
  }

  /**
   * Initialize the service
   */
  ScheduleServiceClass.prototype.init = function() {
    this.sheetManager = SheetManager.getInstance();
    this.authService = AuthService.getInstance();
    this.auditService = AuditService.getInstance();
  };

  /**
   * Check if user can access faculty schedule
   * SECURITY: Faculty can only access their own schedule, Admins can access all
   * @param {string} facultyEmail - Email of faculty whose schedule is being accessed
   * @return {Object} { allowed: boolean, reason: string }
   */
  ScheduleServiceClass.prototype.canAccessSchedule = function(facultyEmail) {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();
      var currentRole = this.authService.getCurrentUserRole();

      // Admins can access all schedules
      if (currentRole === AuthService.Roles.ADMIN) {
        return { allowed: true, reason: 'Admin access' };
      }

      // Faculty can only access their own schedule
      if (currentRole === AuthService.Roles.FACULTY) {
        if (currentUserEmail === facultyEmail) {
          return { allowed: true, reason: 'Own schedule' };
        } else {
          return {
            allowed: false,
            reason: 'Faculty can only access their own schedule'
          };
        }
      }

      // Guests cannot access any schedules
      return { allowed: false, reason: 'Insufficient permissions' };
    } catch (e) {
      Logger.error('Failed to check schedule access', {
        error: e.toString(),
        facultyEmail: facultyEmail
      });
      return { allowed: false, reason: 'Access check failed' };
    }
  };

  /**
   * Get schedule for a faculty member
   * SECURITY: Enforces access control and logs all attempts
   * @param {string} facultyEmail - Email of faculty member
   * @param {Object} filters - Optional filters (startDate, endDate, eventType)
   * @return {Object} { success: boolean, events: Array, error: string }
   */
  ScheduleServiceClass.prototype.getSchedule = function(facultyEmail, filters) {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();

      // Check access permission
      var accessCheck = this.canAccessSchedule(facultyEmail);
      if (!accessCheck.allowed) {
        // Log access denied
        this.auditService.logAccessDenied(
          'schedule-view',
          accessCheck.reason,
          {
            targetFacultyEmail: facultyEmail,
            requestorEmail: currentUserEmail,
            requestorRole: this.authService.getCurrentUserRole()
          }
        );

        return {
          success: false,
          events: [],
          error: 'Access denied: ' + accessCheck.reason
        };
      }

      // Log successful access
      this.auditService.logScheduleAccess(facultyEmail, 'view', {
        filters: filters ? JSON.stringify(filters) : 'none'
      });

      // Query schedule with filters
      var events = this.sheetManager.queryRows('Schedule', function(row) {
        if (row.FacultyEmail !== facultyEmail) {
          return false;
        }

        if (row.Status !== 'Active') {
          return false;
        }

        if (filters) {
          if (filters.startDate && new Date(row.StartDateTime) < new Date(filters.startDate)) {
            return false;
          }
          if (filters.endDate && new Date(row.EndDateTime) > new Date(filters.endDate)) {
            return false;
          }
          if (filters.eventType && row.EventType !== filters.eventType) {
            return false;
          }
        }

        return true;
      });

      return {
        success: true,
        events: events,
        error: null
      };
    } catch (e) {
      Logger.error('Failed to get schedule', {
        error: e.toString(),
        facultyEmail: facultyEmail
      });
      return {
        success: false,
        events: [],
        error: e.toString()
      };
    }
  };

  /**
   * Update a schedule event
   * SECURITY: Faculty can only update their own events
   * @param {string} eventId - Event ID to update
   * @param {Object} updates - Fields to update
   * @return {Object} { success: boolean, error: string }
   */
  ScheduleServiceClass.prototype.updateEvent = function(eventId, updates) {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();
      var currentRole = this.authService.getCurrentUserRole();

      // Find the event
      var event = this.sheetManager.findRow('Schedule', { EventID: eventId });
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // Check access permission
      var accessCheck = this.canAccessSchedule(event.FacultyEmail);
      if (!accessCheck.allowed) {
        // Log access denied
        this.auditService.logAccessDenied(
          'schedule-modify',
          accessCheck.reason,
          {
            eventId: eventId,
            targetFacultyEmail: event.FacultyEmail,
            requestorEmail: currentUserEmail,
            requestorRole: currentRole
          }
        );

        return {
          success: false,
          error: 'Access denied: ' + accessCheck.reason
        };
      }

      // Sanitize all update values
      var sanitizedUpdates = SecurityUtils.sanitizeObject(updates);

      // Log the modification
      this.auditService.logDataModification('Schedule', 'update', {
        eventId: eventId,
        facultyEmail: event.FacultyEmail,
        updates: JSON.stringify(sanitizedUpdates)
      });

      // Perform the update
      var success = this.sheetManager.updateRowByCriteria(
        'Schedule',
        { EventID: eventId },
        sanitizedUpdates
      );

      return {
        success: success,
        error: success ? null : 'Update failed'
      };
    } catch (e) {
      Logger.error('Failed to update event', {
        error: e.toString(),
        eventId: eventId
      });
      return {
        success: false,
        error: e.toString()
      };
    }
  };

  /**
   * Delete a schedule event
   * SECURITY: Faculty can only delete their own events
   * @param {string} eventId - Event ID to delete
   * @return {Object} { success: boolean, error: string }
   */
  ScheduleServiceClass.prototype.deleteEvent = function(eventId) {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();
      var currentRole = this.authService.getCurrentUserRole();

      // Find the event
      var event = this.sheetManager.findRow('Schedule', { EventID: eventId });
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // Check access permission
      var accessCheck = this.canAccessSchedule(event.FacultyEmail);
      if (!accessCheck.allowed) {
        // Log access denied
        this.auditService.logAccessDenied(
          'schedule-delete',
          accessCheck.reason,
          {
            eventId: eventId,
            targetFacultyEmail: event.FacultyEmail,
            requestorEmail: currentUserEmail,
            requestorRole: currentRole
          }
        );

        return {
          success: false,
          error: 'Access denied: ' + accessCheck.reason
        };
      }

      // Log the deletion
      this.auditService.logDataModification('Schedule', 'delete', {
        eventId: eventId,
        facultyEmail: event.FacultyEmail,
        eventType: event.EventType
      });

      // Soft delete by setting status to Inactive
      var success = this.sheetManager.updateRowByCriteria(
        'Schedule',
        { EventID: eventId },
        { Status: 'Inactive' }
      );

      return {
        success: success,
        error: success ? null : 'Delete failed'
      };
    } catch (e) {
      Logger.error('Failed to delete event', {
        error: e.toString(),
        eventId: eventId
      });
      return {
        success: false,
        error: e.toString()
      };
    }
  };

  /**
   * Create a new schedule event
   * SECURITY: Validates and sanitizes all input
   * @param {Object} eventData - Event data
   * @return {Object} { success: boolean, eventId: string, error: string }
   */
  ScheduleServiceClass.prototype.createEvent = function(eventData) {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();
      var currentRole = this.authService.getCurrentUserRole();

      // Determine faculty email
      var facultyEmail = eventData.FacultyEmail || currentUserEmail;

      // Check if user can create event for this faculty
      var accessCheck = this.canAccessSchedule(facultyEmail);
      if (!accessCheck.allowed) {
        this.auditService.logAccessDenied(
          'schedule-create',
          accessCheck.reason,
          {
            targetFacultyEmail: facultyEmail,
            requestorEmail: currentUserEmail,
            requestorRole: currentRole
          }
        );

        return {
          success: false,
          error: 'Access denied: ' + accessCheck.reason
        };
      }

      // Validate and sanitize input
      var validation = SecurityUtils.validateInput(eventData.EventType, {
        required: true,
        maxLength: 255
      });
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid EventType: ' + validation.errors.join(', ')
        };
      }

      // Sanitize all fields
      var sanitizedData = SecurityUtils.sanitizeObject(eventData);

      // Generate event ID
      var eventId = 'EVT-' + new Date().getTime();

      // Create event row
      var eventRow = [
        eventId,
        facultyEmail,
        sanitizedData.EventType || '',
        sanitizedData.StartDateTime || '',
        sanitizedData.EndDateTime || '',
        sanitizedData.Location || '',
        sanitizedData.Description || '',
        'Active',
        '' // CalendarEventID
      ];

      // Append to sheet
      this.sheetManager.appendRow('Schedule', eventRow);

      // Log the creation
      this.auditService.logDataModification('Schedule', 'create', {
        eventId: eventId,
        facultyEmail: facultyEmail,
        eventType: sanitizedData.EventType
      });

      return {
        success: true,
        eventId: eventId,
        error: null
      };
    } catch (e) {
      Logger.error('Failed to create event', {
        error: e.toString()
      });
      return {
        success: false,
        error: e.toString()
      };
    }
  };

  /**
   * Get singleton instance
   */
  function getInstance() {
    if (!instance) {
      instance = new ScheduleServiceClass();
      instance.init();
    }
    return instance;
  }

  return {
    getInstance: getInstance
  };
})();
