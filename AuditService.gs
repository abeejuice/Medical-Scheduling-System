/**
 * AuditService - Comprehensive audit logging for security events
 * Records all access attempts, authorization failures, and sensitive operations
 */
var AuditService = (function() {
  'use strict';

  var instance = null;

  var EventType = {
    ACCESS_GRANTED: 'ACCESS_GRANTED',
    ACCESS_DENIED: 'ACCESS_DENIED',
    AUTH_SUCCESS: 'AUTH_SUCCESS',
    AUTH_FAILURE: 'AUTH_FAILURE',
    DATA_ACCESS: 'DATA_ACCESS',
    DATA_MODIFICATION: 'DATA_MODIFICATION',
    BULK_UPLOAD: 'BULK_UPLOAD',
    UNAUTHORIZED_ATTEMPT: 'UNAUTHORIZED_ATTEMPT',
    INPUT_VALIDATION_FAILURE: 'INPUT_VALIDATION_FAILURE'
  };

  function AuditServiceClass() {
    this.sheetManager = null;
  }

  /**
   * Initialize the service
   */
  AuditServiceClass.prototype.init = function() {
    this.sheetManager = SheetManager.getInstance();
  };

  /**
   * Log an audit event
   * @param {string} eventType - Type of event (from EventType enum)
   * @param {string} action - Description of the action
   * @param {Object} metadata - Additional metadata
   * @return {boolean} Success status
   */
  AuditServiceClass.prototype.logEvent = function(eventType, action, metadata) {
    try {
      var timestamp = new Date().toISOString();
      var userEmail = 'unknown';

      try {
        userEmail = Session.getActiveUser().getEmail() || 'unknown';
      } catch (e) {
        // If we can't get user email, continue with 'unknown'
      }

      var metadataStr = metadata ? JSON.stringify(metadata) : '';

      // Log to AuditLog sheet
      this.sheetManager.appendRow('AuditLog', [
        timestamp,
        eventType,
        action,
        metadataStr,
        userEmail
      ]);

      // Also log to console for debugging
      console.log('[AUDIT] ' + timestamp + ' | ' + eventType + ' | ' + userEmail + ' | ' + action);

      return true;
    } catch (e) {
      console.error('Failed to log audit event: ' + e.toString());
      return false;
    }
  };

  /**
   * Log successful access
   * @param {string} resource - Resource accessed
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logAccessGranted = function(resource, metadata) {
    return this.logEvent(
      EventType.ACCESS_GRANTED,
      'Access granted to ' + resource,
      metadata
    );
  };

  /**
   * Log denied access attempt
   * @param {string} resource - Resource attempted to access
   * @param {string} reason - Reason for denial
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logAccessDenied = function(resource, reason, metadata) {
    var meta = metadata || {};
    meta.denialReason = reason;

    return this.logEvent(
      EventType.ACCESS_DENIED,
      'Access denied to ' + resource,
      meta
    );
  };

  /**
   * Log authentication success
   * @param {string} role - User's role
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logAuthSuccess = function(role, metadata) {
    var meta = metadata || {};
    meta.role = role;

    return this.logEvent(
      EventType.AUTH_SUCCESS,
      'User authenticated successfully',
      meta
    );
  };

  /**
   * Log authentication failure
   * @param {string} reason - Reason for failure
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logAuthFailure = function(reason, metadata) {
    var meta = metadata || {};
    meta.failureReason = reason;

    return this.logEvent(
      EventType.AUTH_FAILURE,
      'Authentication failed',
      meta
    );
  };

  /**
   * Log data access
   * @param {string} resource - Resource accessed (e.g., 'Faculty', 'Schedule')
   * @param {string} operation - Operation performed (e.g., 'read', 'query')
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logDataAccess = function(resource, operation, metadata) {
    var meta = metadata || {};
    meta.resource = resource;
    meta.operation = operation;

    return this.logEvent(
      EventType.DATA_ACCESS,
      operation + ' operation on ' + resource,
      meta
    );
  };

  /**
   * Log data modification
   * @param {string} resource - Resource modified
   * @param {string} operation - Operation performed (e.g., 'create', 'update', 'delete')
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logDataModification = function(resource, operation, metadata) {
    var meta = metadata || {};
    meta.resource = resource;
    meta.operation = operation;

    return this.logEvent(
      EventType.DATA_MODIFICATION,
      operation + ' operation on ' + resource,
      meta
    );
  };

  /**
   * Log bulk upload operation
   * @param {string} dataType - Type of data uploaded (e.g., 'faculty', 'events')
   * @param {number} recordCount - Number of records uploaded
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logBulkUpload = function(dataType, recordCount, metadata) {
    var meta = metadata || {};
    meta.dataType = dataType;
    meta.recordCount = recordCount;

    return this.logEvent(
      EventType.BULK_UPLOAD,
      'Bulk upload of ' + recordCount + ' ' + dataType + ' records',
      meta
    );
  };

  /**
   * Log unauthorized access attempt
   * @param {string} resource - Resource attempted to access
   * @param {string} requiredRole - Role required for access
   * @param {string} actualRole - Actual role of the user
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logUnauthorizedAttempt = function(resource, requiredRole, actualRole, metadata) {
    var meta = metadata || {};
    meta.resource = resource;
    meta.requiredRole = requiredRole;
    meta.actualRole = actualRole;

    return this.logEvent(
      EventType.UNAUTHORIZED_ATTEMPT,
      'Unauthorized attempt to access ' + resource,
      meta
    );
  };

  /**
   * Log input validation failure (potential XSS attempt)
   * @param {string} fieldName - Name of the field that failed validation
   * @param {string} reason - Reason for validation failure
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logInputValidationFailure = function(fieldName, reason, metadata) {
    var meta = metadata || {};
    meta.fieldName = fieldName;
    meta.validationFailureReason = reason;

    return this.logEvent(
      EventType.INPUT_VALIDATION_FAILURE,
      'Input validation failed for ' + fieldName + ': ' + reason,
      meta
    );
  };

  /**
   * Log faculty schedule access
   * @param {string} facultyEmail - Email of faculty whose schedule was accessed
   * @param {string} accessType - Type of access (view, modify)
   * @param {Object} metadata - Additional metadata
   */
  AuditServiceClass.prototype.logScheduleAccess = function(facultyEmail, accessType, metadata) {
    var meta = metadata || {};
    meta.facultyEmail = facultyEmail;
    meta.accessType = accessType;

    var currentUserEmail = 'unknown';
    try {
      currentUserEmail = Session.getActiveUser().getEmail() || 'unknown';
    } catch (e) {
      // Continue with 'unknown'
    }

    var action = accessType + ' schedule for ' + facultyEmail;
    if (facultyEmail !== currentUserEmail) {
      action += ' (cross-user access)';
    }

    return this.logEvent(
      EventType.DATA_ACCESS,
      action,
      meta
    );
  };

  /**
   * Get audit logs for a specific user
   * @param {string} userEmail - User email to filter by
   * @param {number} limit - Maximum number of logs to return (default: 100)
   * @return {Array} Array of audit log entries
   */
  AuditServiceClass.prototype.getUserAuditLogs = function(userEmail, limit) {
    try {
      limit = limit || 100;

      var allLogs = this.sheetManager.queryRows('AuditLog', function(row) {
        return row.UserEmail === userEmail;
      });

      // Sort by timestamp descending (most recent first)
      allLogs.sort(function(a, b) {
        return new Date(b.Timestamp) - new Date(a.Timestamp);
      });

      // Limit results
      if (allLogs.length > limit) {
        allLogs = allLogs.slice(0, limit);
      }

      return allLogs;
    } catch (e) {
      Logger.error('Failed to get user audit logs', {
        error: e.toString(),
        userEmail: userEmail
      });
      return [];
    }
  };

  /**
   * Get recent access denied events
   * @param {number} limit - Maximum number of logs to return (default: 50)
   * @return {Array} Array of access denied entries
   */
  AuditServiceClass.prototype.getAccessDeniedEvents = function(limit) {
    try {
      limit = limit || 50;

      var deniedEvents = this.sheetManager.queryRows('AuditLog', function(row) {
        return row.Severity === EventType.ACCESS_DENIED ||
               row.Severity === EventType.UNAUTHORIZED_ATTEMPT;
      });

      // Sort by timestamp descending
      deniedEvents.sort(function(a, b) {
        return new Date(b.Timestamp) - new Date(a.Timestamp);
      });

      // Limit results
      if (deniedEvents.length > limit) {
        deniedEvents = deniedEvents.slice(0, limit);
      }

      return deniedEvents;
    } catch (e) {
      Logger.error('Failed to get access denied events', {
        error: e.toString()
      });
      return [];
    }
  };

  /**
   * Get singleton instance
   */
  function getInstance() {
    if (!instance) {
      instance = new AuditServiceClass();
      instance.init();
    }
    return instance;
  }

  return {
    getInstance: getInstance,
    EventType: EventType
  };
})();
