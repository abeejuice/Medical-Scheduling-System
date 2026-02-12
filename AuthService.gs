/**
 * AuthService - Handles user authentication and role management
 * Identifies current user and determines their role from Faculty sheet
 */
var AuthService = (function() {
  var instance;
  var logger = Logger.getInstance();
  var sheetManager = SheetManager.getInstance();

  function createInstance() {
    return {
      /**
       * Role constants
       */
      Role: {
        ADMIN: 'Admin',
        FACULTY: 'Faculty',
        UNKNOWN: 'Unknown'
      },

      /**
       * Get the current user's email
       * @returns {string} User email
       */
      getCurrentUserEmail: function() {
        try {
          var email = Session.getActiveUser().getEmail();

          if (!email) {
            logger.warning('Unable to get user email from session');
            throw new Error('Unable to identify current user');
          }

          return email;
        } catch (e) {
          logger.error('Failed to get current user email', { error: e.toString() });
          throw new Error('Authentication failed: ' + e.toString());
        }
      },

      /**
       * Get current user information including role
       * @returns {Object} User object with email, name, role, and facultyId
       */
      getCurrentUser: function() {
        try {
          var email = this.getCurrentUserEmail();
          var userInfo = this.getUserByEmail(email);

          if (!userInfo) {
            logger.warning('User not found in Faculty sheet', { email: email });
            return {
              email: email,
              name: email.split('@')[0],
              role: this.Role.UNKNOWN,
              facultyId: null
            };
          }

          logger.info('User authenticated successfully', {
            email: email,
            role: userInfo.role
          });

          return userInfo;
        } catch (e) {
          logger.error('Failed to get current user', { error: e.toString() });
          throw new Error('Failed to authenticate user: ' + e.toString());
        }
      },

      /**
       * Get user information by email from Faculty sheet
       * @param {string} email - User email
       * @returns {Object|null} User object or null if not found
       */
      getUserByEmail: function(email) {
        try {
          var facultyRow = sheetManager.findRow('Faculty', { Email: email });

          if (!facultyRow) {
            return null;
          }

          return {
            email: facultyRow.data.Email,
            name: facultyRow.data.Name,
            role: facultyRow.data.Role,
            facultyId: facultyRow.data.FacultyID,
            department: facultyRow.data.Department,
            specialty: facultyRow.data.Specialty,
            rowNumber: facultyRow.rowNumber
          };
        } catch (e) {
          logger.error('Failed to get user by email', {
            email: email,
            error: e.toString()
          });
          throw new Error('Failed to retrieve user information: ' + e.toString());
        }
      },

      /**
       * Check if current user has a specific role
       * @param {string} requiredRole - Required role (Admin or Faculty)
       * @returns {boolean} True if user has the role
       */
      hasRole: function(requiredRole) {
        try {
          var user = this.getCurrentUser();
          return user.role === requiredRole;
        } catch (e) {
          logger.error('Failed to check user role', {
            requiredRole: requiredRole,
            error: e.toString()
          });
          return false;
        }
      },

      /**
       * Check if current user is an admin
       * @returns {boolean} True if user is admin
       */
      isAdmin: function() {
        return this.hasRole(this.Role.ADMIN);
      },

      /**
       * Check if current user is faculty
       * @returns {boolean} True if user is faculty
       */
      isFaculty: function() {
        return this.hasRole(this.Role.FACULTY);
      },

      /**
       * Require authentication and specific role
       * Throws error if user doesn't have required role
       * @param {string} requiredRole - Required role
       * @throws {Error} If user doesn't have required role
       */
      requireRole: function(requiredRole) {
        var user = this.getCurrentUser();

        if (user.role !== requiredRole) {
          logger.warning('Unauthorized access attempt', {
            email: user.email,
            currentRole: user.role,
            requiredRole: requiredRole
          });
          throw new Error('Unauthorized: ' + requiredRole + ' role required');
        }

        return user;
      },

      /**
       * Require admin role
       * @throws {Error} If user is not admin
       */
      requireAdmin: function() {
        return this.requireRole(this.Role.ADMIN);
      },

      /**
       * Require faculty role (Admin or Faculty)
       * @throws {Error} If user is not faculty or admin
       */
      requireFaculty: function() {
        var user = this.getCurrentUser();

        if (user.role !== this.Role.ADMIN && user.role !== this.Role.FACULTY) {
          logger.warning('Unauthorized access attempt - faculty required', {
            email: user.email,
            currentRole: user.role
          });
          throw new Error('Unauthorized: Faculty role required');
        }

        return user;
      },

      /**
       * Get all faculty members
       * @returns {Array} Array of faculty user objects
       */
      getAllFaculty: function() {
        try {
          var facultyRows = sheetManager.getAllRows('Faculty');
          var facultyList = [];

          for (var i = 0; i < facultyRows.length; i++) {
            var row = facultyRows[i];
            facultyList.push({
              email: row.data.Email,
              name: row.data.Name,
              role: row.data.Role,
              facultyId: row.data.FacultyID,
              department: row.data.Department,
              specialty: row.data.Specialty,
              rowNumber: row.rowNumber
            });
          }

          return facultyList;
        } catch (e) {
          logger.error('Failed to get all faculty', { error: e.toString() });
          throw new Error('Failed to retrieve faculty list: ' + e.toString());
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
