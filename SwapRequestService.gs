/**
 * SwapRequestService - Manages schedule swap requests with audit logging
 * SECURITY: All swap requests are logged to audit trail
 */
var SwapRequestService = (function() {
  'use strict';

  var instance = null;

  function SwapRequestServiceClass() {
    this.sheetManager = null;
    this.authService = null;
    this.auditService = null;
  }

  /**
   * Initialize the service
   */
  SwapRequestServiceClass.prototype.init = function() {
    this.sheetManager = SheetManager.getInstance();
    this.authService = AuthService.getInstance();
    this.auditService = AuditService.getInstance();
  };

  /**
   * Create a new swap request
   * @param {Object} requestData - Request data
   * @return {Object} { success: boolean, requestId: string, error: string }
   */
  SwapRequestServiceClass.prototype.createSwapRequest = function(requestData) {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();

      // Validate input
      if (!requestData.TargetEmail || !requestData.EventID) {
        return {
          success: false,
          error: 'TargetEmail and EventID are required'
        };
      }

      // Sanitize input
      var sanitizedData = SecurityUtils.sanitizeObject(requestData);

      // Generate request ID
      var requestId = 'SWAP-' + new Date().getTime();

      // Create request row
      var requestRow = [
        requestId,
        currentUserEmail,
        sanitizedData.TargetEmail,
        sanitizedData.EventID,
        new Date().toISOString(),
        'Pending',
        '', // ApproverEmail
        '', // ApprovalDate
        sanitizedData.Comments || ''
      ];

      // Append to sheet
      this.sheetManager.appendRow('SwapRequests', requestRow);

      // Log the swap request creation
      this.auditService.logSwapRequest('create', requestId, {
        requesterEmail: currentUserEmail,
        targetEmail: sanitizedData.TargetEmail,
        eventId: sanitizedData.EventID
      });

      return {
        success: true,
        requestId: requestId,
        error: null
      };
    } catch (e) {
      Logger.error('Failed to create swap request', {
        error: e.toString()
      });
      return {
        success: false,
        error: e.toString()
      };
    }
  };

  /**
   * Approve a swap request
   * @param {string} requestId - Request ID to approve
   * @return {Object} { success: boolean, error: string }
   */
  SwapRequestServiceClass.prototype.approveSwapRequest = function(requestId) {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();
      var currentRole = this.authService.getCurrentUserRole();

      // Find the request
      var request = this.sheetManager.findRow('SwapRequests', { RequestID: requestId });
      if (!request) {
        return {
          success: false,
          error: 'Swap request not found'
        };
      }

      // Check authorization (target faculty or admin)
      if (currentRole !== AuthService.Roles.ADMIN && currentUserEmail !== request.TargetEmail) {
        this.auditService.logAccessDenied(
          'swap-request-approve',
          'Only target faculty or admin can approve',
          {
            requestId: requestId,
            requesterEmail: request.RequesterEmail,
            targetEmail: request.TargetEmail
          }
        );

        return {
          success: false,
          error: 'Access denied: Only target faculty or admin can approve swap requests'
        };
      }

      // Update request status
      var success = this.sheetManager.updateRowByCriteria(
        'SwapRequests',
        { RequestID: requestId },
        {
          Status: 'Approved',
          ApproverEmail: currentUserEmail,
          ApprovalDate: new Date().toISOString()
        }
      );

      if (success) {
        // Log the approval
        this.auditService.logSwapRequest('approve', requestId, {
          requesterEmail: request.RequesterEmail,
          targetEmail: request.TargetEmail,
          eventId: request.EventID,
          approverEmail: currentUserEmail
        });
      }

      return {
        success: success,
        error: success ? null : 'Failed to approve swap request'
      };
    } catch (e) {
      Logger.error('Failed to approve swap request', {
        error: e.toString(),
        requestId: requestId
      });
      return {
        success: false,
        error: e.toString()
      };
    }
  };

  /**
   * Reject a swap request
   * @param {string} requestId - Request ID to reject
   * @return {Object} { success: boolean, error: string }
   */
  SwapRequestServiceClass.prototype.rejectSwapRequest = function(requestId) {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();
      var currentRole = this.authService.getCurrentUserRole();

      // Find the request
      var request = this.sheetManager.findRow('SwapRequests', { RequestID: requestId });
      if (!request) {
        return {
          success: false,
          error: 'Swap request not found'
        };
      }

      // Check authorization (target faculty or admin)
      if (currentRole !== AuthService.Roles.ADMIN && currentUserEmail !== request.TargetEmail) {
        this.auditService.logAccessDenied(
          'swap-request-reject',
          'Only target faculty or admin can reject',
          {
            requestId: requestId,
            requesterEmail: request.RequesterEmail,
            targetEmail: request.TargetEmail
          }
        );

        return {
          success: false,
          error: 'Access denied: Only target faculty or admin can reject swap requests'
        };
      }

      // Update request status
      var success = this.sheetManager.updateRowByCriteria(
        'SwapRequests',
        { RequestID: requestId },
        {
          Status: 'Rejected',
          ApproverEmail: currentUserEmail,
          ApprovalDate: new Date().toISOString()
        }
      );

      if (success) {
        // Log the rejection
        this.auditService.logSwapRequest('reject', requestId, {
          requesterEmail: request.RequesterEmail,
          targetEmail: request.TargetEmail,
          eventId: request.EventID,
          approverEmail: currentUserEmail
        });
      }

      return {
        success: success,
        error: success ? null : 'Failed to reject swap request'
      };
    } catch (e) {
      Logger.error('Failed to reject swap request', {
        error: e.toString(),
        requestId: requestId
      });
      return {
        success: false,
        error: e.toString()
      };
    }
  };

  /**
   * Cancel a swap request (by requester)
   * @param {string} requestId - Request ID to cancel
   * @return {Object} { success: boolean, error: string }
   */
  SwapRequestServiceClass.prototype.cancelSwapRequest = function(requestId) {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();

      // Find the request
      var request = this.sheetManager.findRow('SwapRequests', { RequestID: requestId });
      if (!request) {
        return {
          success: false,
          error: 'Swap request not found'
        };
      }

      // Check authorization (only requester can cancel)
      if (currentUserEmail !== request.RequesterEmail) {
        this.auditService.logAccessDenied(
          'swap-request-cancel',
          'Only requester can cancel',
          {
            requestId: requestId,
            requesterEmail: request.RequesterEmail
          }
        );

        return {
          success: false,
          error: 'Access denied: Only the requester can cancel swap requests'
        };
      }

      // Update request status
      var success = this.sheetManager.updateRowByCriteria(
        'SwapRequests',
        { RequestID: requestId },
        { Status: 'Cancelled' }
      );

      if (success) {
        // Log the cancellation
        this.auditService.logSwapRequest('cancel', requestId, {
          requesterEmail: request.RequesterEmail,
          targetEmail: request.TargetEmail,
          eventId: request.EventID
        });
      }

      return {
        success: success,
        error: success ? null : 'Failed to cancel swap request'
      };
    } catch (e) {
      Logger.error('Failed to cancel swap request', {
        error: e.toString(),
        requestId: requestId
      });
      return {
        success: false,
        error: e.toString()
      };
    }
  };

  /**
   * Get swap requests for current user
   * @return {Object} { success: boolean, requests: Array, error: string }
   */
  SwapRequestServiceClass.prototype.getMySwapRequests = function() {
    try {
      var currentUserEmail = this.authService.getCurrentUserEmail();

      // Query swap requests where user is either requester or target
      var requests = this.sheetManager.queryRows('SwapRequests', function(row) {
        return row.RequesterEmail === currentUserEmail || row.TargetEmail === currentUserEmail;
      });

      // Sort by request date descending
      requests.sort(function(a, b) {
        return new Date(b.RequestDate) - new Date(a.RequestDate);
      });

      return {
        success: true,
        requests: requests,
        error: null
      };
    } catch (e) {
      Logger.error('Failed to get swap requests', {
        error: e.toString()
      });
      return {
        success: false,
        requests: [],
        error: e.toString()
      };
    }
  };

  /**
   * Get singleton instance
   */
  function getInstance() {
    if (!instance) {
      instance = new SwapRequestServiceClass();
      instance.init();
    }
    return instance;
  }

  return {
    getInstance: getInstance
  };
})();
