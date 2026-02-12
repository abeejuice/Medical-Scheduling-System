/**
 * AuthService - Authentication and authorization service
 * Identifies current user and their role from Faculty sheet
 */
var AuthService = (function() {
  'use strict';

  var instance = null;

  var Roles = {
    ADMIN: 'Admin',
    FACULTY: 'Faculty',
    GUEST: 'Guest'
  };

  function AuthServiceClass() {
    this.currentUser = null;
    this.userRole = null;
  }

  /**
   * Get the current user's email
   * @return {string} User email
   */
  AuthServiceClass.prototype.getCurrentUserEmail = function() {
    try {
      var email = Session.getActiveUser().getEmail();
      if (!email) {
        Logger.warning('Could not retrieve user email from session');
        return null;
      }
      return email;
    } catch (e) {
      Logger.error('Failed to get current user email', { error: e.toString() });
      throw e;
    }
  };

  /**
   * Get the current user's information from Faculty sheet
   * @return {Object|null} User object or null if not found
   */
  AuthServiceClass.prototype.getCurrentUser = function() {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      var email = this.getCurrentUserEmail();
      if (!email) {
        return null;
      }

      var sheetManager = SheetManager.getInstance();
      var user = sheetManager.findRow('Faculty', { Email: email });

      if (user) {
        this.currentUser = user;
        this.userRole = user.Role || Roles.GUEST;
        Logger.info('User authenticated', {
          email: email,
          role: this.userRole
        });
      } else {
        Logger.warning('User not found in Faculty sheet', { email: email });
        this.userRole = Roles.GUEST;
      }

      return this.currentUser;
    } catch (e) {
      Logger.error('Failed to get current user', { error: e.toString() });
      throw e;
    }
  };

  /**
   * Get the current user's role
   * @return {string} User role (Admin, Faculty, Guest)
   */
  AuthServiceClass.prototype.getCurrentUserRole = function() {
    try {
      if (this.userRole) {
        return this.userRole;
      }

      this.getCurrentUser();
      return this.userRole || Roles.GUEST;
    } catch (e) {
      Logger.error('Failed to get current user role', { error: e.toString() });
      return Roles.GUEST;
    }
  };

  /**
   * Check if current user has a specific role
   * @param {string} role - Role to check (Admin, Faculty, Guest)
   * @return {boolean} True if user has the role
   */
  AuthServiceClass.prototype.hasRole = function(role) {
    try {
      var currentRole = this.getCurrentUserRole();
      return currentRole === role;
    } catch (e) {
      Logger.error('Failed to check user role', {
        error: e.toString(),
        requestedRole: role
      });
      return false;
    }
  };

  /**
   * Check if current user is an admin
   * @return {boolean} True if user is admin
   */
  AuthServiceClass.prototype.isAdmin = function() {
    return this.hasRole(Roles.ADMIN);
  };

  /**
   * Check if current user is faculty
   * @return {boolean} True if user is faculty
   */
  AuthServiceClass.prototype.isFaculty = function() {
    return this.hasRole(Roles.FACULTY);
  };

  /**
   * Require a specific role or throw error
   * @param {string} role - Required role
   * @throws {Error} If user doesn't have the required role
   */
  AuthServiceClass.prototype.requireRole = function(role) {
    try {
      if (!this.hasRole(role)) {
        var currentRole = this.getCurrentUserRole();
        var email = this.getCurrentUserEmail();
        Logger.error('Unauthorized access attempt', {
          email: email,
          currentRole: currentRole,
          requiredRole: role
        });
        throw new Error('Unauthorized: ' + role + ' role required');
      }
    } catch (e) {
      if (e.message.indexOf('Unauthorized') === 0) {
        throw e;
      }
      Logger.error('Failed to check role requirement', {
        error: e.toString(),
        requiredRole: role
      });
      throw e;
    }
  };

  /**
   * Require admin role or throw error
   * @throws {Error} If user is not admin
   */
  AuthServiceClass.prototype.requireAdmin = function() {
    this.requireRole(Roles.ADMIN);
  };

  /**
   * Require faculty role or throw error
   * @throws {Error} If user is not faculty
   */
  AuthServiceClass.prototype.requireFaculty = function() {
    this.requireRole(Roles.FACULTY);
  };

  /**
   * Reset cached user information (useful after updates)
   */
  AuthServiceClass.prototype.resetCache = function() {
    this.currentUser = null;
    this.userRole = null;
    Logger.debug('AuthService cache reset');
  };

  /**
   * Get all faculty members
   * @return {Array} Array of faculty objects
   */
  AuthServiceClass.prototype.getAllFaculty = function() {
    try {
      var sheetManager = SheetManager.getInstance();
      return sheetManager.queryRows('Faculty', function(row) {
        return row.Status === 'Active';
      });
    } catch (e) {
      Logger.error('Failed to get all faculty', { error: e.toString() });
      throw e;
    }
  };

  /**
   * Get faculty by email
   * @param {string} email - Faculty email
   * @return {Object|null} Faculty object or null if not found
   */
  AuthServiceClass.prototype.getFacultyByEmail = function(email) {
    try {
      var sheetManager = SheetManager.getInstance();
      return sheetManager.findRow('Faculty', { Email: email });
    } catch (e) {
      Logger.error('Failed to get faculty by email', {
        error: e.toString(),
        email: email
      });
      throw e;
    }
  };

  /**
   * Get singleton instance
   */
  function getInstance() {
    if (!instance) {
      instance = new AuthServiceClass();
    }
    return instance;
  }

  return {
    getInstance: getInstance,
    Roles: Roles
  };
})();
