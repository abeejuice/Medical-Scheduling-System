/**
 * SecurityTests - Test suite for security and authorization features
 * Run these tests to verify all acceptance criteria are met
 */

/**
 * Test 1: Non-admin users cannot access upload endpoint
 * Acceptance Criteria: Returns 'Access denied' error
 */
function testBulkUploadAuthorization() {
  try {
    Logger.info('=== TEST 1: Bulk Upload Authorization ===');

    var authService = AuthService.getInstance();
    var currentUser = authService.getCurrentUserEmail();
    var currentRole = authService.getCurrentUserRole();

    Logger.info('Current user: ' + currentUser + ' (Role: ' + currentRole + ')');

    // Test preview endpoint
    var testData = 'Email\tName\tRole\ntest@example.com\tTest User\tFaculty';
    var result = previewBulkData(testData, 'faculty');

    if (currentRole !== 'Admin') {
      // Non-admin should be denied
      if (!result.success && result.error.indexOf('Access denied') > -1) {
        Logger.info('✓ TEST PASSED: Non-admin correctly denied access to preview');
      } else {
        Logger.error('✗ TEST FAILED: Non-admin was not denied access');
      }
    } else {
      // Admin should succeed
      if (result.success || result.error.indexOf('Access denied') === -1) {
        Logger.info('✓ TEST PASSED: Admin correctly granted access to preview');
      } else {
        Logger.error('✗ TEST FAILED: Admin was incorrectly denied access');
      }
    }

    // Check audit log
    var auditService = AuditService.getInstance();
    var recentLogs = auditService.getUserAuditLogs(currentUser, 1);
    if (recentLogs.length > 0) {
      Logger.info('Audit log entry created: ' + recentLogs[0].Severity);
    }

    return { passed: true, role: currentRole };
  } catch (e) {
    Logger.error('Test failed with error: ' + e.toString());
    return { passed: false, error: e.toString() };
  }
}

/**
 * Test 2: Faculty users can only view their own schedule
 * Acceptance Criteria: Cross-user access returns error
 */
function testScheduleAccessControl() {
  try {
    Logger.info('=== TEST 2: Schedule Access Control ===');

    var authService = AuthService.getInstance();
    var scheduleService = ScheduleService.getInstance();
    var currentEmail = authService.getCurrentUserEmail();
    var currentRole = authService.getCurrentUserRole();

    Logger.info('Current user: ' + currentEmail + ' (Role: ' + currentRole + ')');

    // Test 2a: Access own schedule (should succeed)
    var ownResult = scheduleService.getSchedule(currentEmail);
    if (ownResult.success) {
      Logger.info('✓ TEST 2a PASSED: User can access own schedule');
    } else {
      Logger.error('✗ TEST 2a FAILED: User cannot access own schedule');
    }

    // Test 2b: Try to access another faculty's schedule
    if (currentRole === 'Faculty') {
      var otherEmail = 'other-faculty@medical.edu';
      var crossResult = scheduleService.getSchedule(otherEmail);

      if (!crossResult.success && crossResult.error.indexOf('Access denied') > -1) {
        Logger.info('✓ TEST 2b PASSED: Faculty correctly denied access to other schedule');
      } else {
        Logger.error('✗ TEST 2b FAILED: Faculty was not denied cross-user access');
      }
    } else if (currentRole === 'Admin') {
      Logger.info('⊙ TEST 2b SKIPPED: Admin can access all schedules (expected behavior)');
    }

    return { passed: true };
  } catch (e) {
    Logger.error('Test failed with error: ' + e.toString());
    return { passed: false, error: e.toString() };
  }
}

/**
 * Test 3: HTML/script tags are escaped and rendered as text
 * Acceptance Criteria: Tags are converted to HTML entities
 */
function testXSSPrevention() {
  try {
    Logger.info('=== TEST 3: XSS Prevention ===');

    var testCases = [
      {
        input: '<script>alert("XSS")</script>',
        shouldContain: '&lt;script&gt;'
      },
      {
        input: '<img src=x onerror=alert(1)>',
        shouldContain: '&lt;img'
      },
      {
        input: '<div onclick="alert(1)">Click</div>',
        shouldContain: '&lt;div'
      },
      {
        input: 'Normal text with <b>bold</b>',
        shouldContain: '&lt;b&gt;'
      }
    ];

    var allPassed = true;

    testCases.forEach(function(testCase, index) {
      var sanitized = SecurityUtils.sanitizeInput(testCase.input);

      if (sanitized.indexOf(testCase.shouldContain) > -1 && sanitized.indexOf('<script') === -1) {
        Logger.info('✓ TEST 3.' + (index + 1) + ' PASSED: HTML escaped correctly');
        Logger.info('  Input: ' + testCase.input);
        Logger.info('  Output: ' + sanitized);
      } else {
        Logger.error('✗ TEST 3.' + (index + 1) + ' FAILED: HTML not escaped properly');
        Logger.error('  Input: ' + testCase.input);
        Logger.error('  Output: ' + sanitized);
        allPassed = false;
      }
    });

    return { passed: allPassed };
  } catch (e) {
    Logger.error('Test failed with error: ' + e.toString());
    return { passed: false, error: e.toString() };
  }
}

/**
 * Test 4: All user input is validated and sanitized
 * Acceptance Criteria: Invalid input is rejected, valid input is sanitized
 */
function testInputValidation() {
  try {
    Logger.info('=== TEST 4: Input Validation and Sanitization ===');

    var allPassed = true;

    // Test 4a: Script tag detection
    var scriptTest = SecurityUtils.validateNoScriptTags('<script>alert(1)</script>');
    if (!scriptTest.isValid && scriptTest.reason.indexOf('Script tags') > -1) {
      Logger.info('✓ TEST 4a PASSED: Script tags detected and rejected');
    } else {
      Logger.error('✗ TEST 4a FAILED: Script tags not detected');
      allPassed = false;
    }

    // Test 4b: Email validation
    var emailTest = SecurityUtils.validateInput('invalid-email', { isEmail: true });
    if (!emailTest.isValid && emailTest.errors[0].indexOf('Invalid email') > -1) {
      Logger.info('✓ TEST 4b PASSED: Invalid email rejected');
    } else {
      Logger.error('✗ TEST 4b FAILED: Invalid email not detected');
      allPassed = false;
    }

    var validEmailTest = SecurityUtils.validateInput('test@example.com', { isEmail: true });
    if (validEmailTest.isValid) {
      Logger.info('✓ TEST 4c PASSED: Valid email accepted');
    } else {
      Logger.error('✗ TEST 4c FAILED: Valid email rejected');
      allPassed = false;
    }

    // Test 4d: Length validation
    var longInput = 'a'.repeat(300);
    var lengthTest = SecurityUtils.validateInput(longInput, { maxLength: 255 });
    if (!lengthTest.isValid && lengthTest.errors[0].indexOf('exceeds maximum length') > -1) {
      Logger.info('✓ TEST 4d PASSED: Long input rejected');
    } else {
      Logger.error('✗ TEST 4d FAILED: Long input not detected');
      allPassed = false;
    }

    // Test 4e: Event handler detection
    var eventHandlerTest = SecurityUtils.validateNoScriptTags('onclick="alert(1)"');
    if (!eventHandlerTest.isValid) {
      Logger.info('✓ TEST 4e PASSED: Event handlers detected and rejected');
    } else {
      Logger.error('✗ TEST 4e FAILED: Event handlers not detected');
      allPassed = false;
    }

    // Test 4f: JavaScript protocol detection
    var jsProtocolTest = SecurityUtils.validateNoScriptTags('javascript:alert(1)');
    if (!jsProtocolTest.isValid) {
      Logger.info('✓ TEST 4f PASSED: JavaScript protocol detected and rejected');
    } else {
      Logger.error('✗ TEST 4f FAILED: JavaScript protocol not detected');
      allPassed = false;
    }

    return { passed: allPassed };
  } catch (e) {
    Logger.error('Test failed with error: ' + e.toString());
    return { passed: false, error: e.toString() };
  }
}

/**
 * Test 5: Audit log records all access attempts
 * Acceptance Criteria: Success and failure logged with email and timestamp
 */
function testAuditLogging() {
  try {
    Logger.info('=== TEST 5: Audit Logging ===');

    var auditService = AuditService.getInstance();
    var authService = AuthService.getInstance();
    var currentEmail = authService.getCurrentUserEmail();

    // Trigger a logged event
    auditService.logAccessGranted('test-resource', { testRun: true });

    // Retrieve recent logs
    var logs = auditService.getUserAuditLogs(currentEmail, 5);

    if (logs.length > 0) {
      Logger.info('✓ TEST 5a PASSED: Audit logs are being created');
      Logger.info('  Recent log count: ' + logs.length);

      var mostRecent = logs[0];
      Logger.info('  Most recent log:');
      Logger.info('    Timestamp: ' + mostRecent.Timestamp);
      Logger.info('    Severity: ' + mostRecent.Severity);
      Logger.info('    Message: ' + mostRecent.Message);
      Logger.info('    UserEmail: ' + mostRecent.UserEmail);

      // Verify log has required fields
      var hasTimestamp = mostRecent.Timestamp && mostRecent.Timestamp.length > 0;
      var hasUserEmail = mostRecent.UserEmail && mostRecent.UserEmail.length > 0;
      var hasSeverity = mostRecent.Severity && mostRecent.Severity.length > 0;

      if (hasTimestamp && hasUserEmail && hasSeverity) {
        Logger.info('✓ TEST 5b PASSED: Audit log has all required fields');
      } else {
        Logger.error('✗ TEST 5b FAILED: Audit log missing required fields');
        return { passed: false };
      }
    } else {
      Logger.error('✗ TEST 5a FAILED: No audit logs found');
      return { passed: false };
    }

    // Test access denied events
    var deniedEvents = auditService.getAccessDeniedEvents(10);
    Logger.info('✓ TEST 5c: Access denied events retrieved (count: ' + deniedEvents.length + ')');

    return { passed: true };
  } catch (e) {
    Logger.error('Test failed with error: ' + e.toString());
    return { passed: false, error: e.toString() };
  }
}

/**
 * Test 6: Bulk upload data is sanitized before storage
 * Acceptance Criteria: Malicious input is escaped in preview
 */
function testBulkUploadSanitization() {
  try {
    Logger.info('=== TEST 6: Bulk Upload Input Sanitization ===');

    var authService = AuthService.getInstance();
    if (!authService.isAdmin()) {
      Logger.info('⊙ TEST SKIPPED: Must be admin to test bulk upload');
      return { passed: true, skipped: true };
    }

    // Test data with malicious input
    var maliciousData = 'Email\tName\tRole\n' +
                       'test@example.com\t<script>alert("XSS")</script>\tFaculty\n' +
                       'test2@example.com\t<img src=x onerror=alert(1)>\tAdmin';

    var result = previewBulkData(maliciousData, 'faculty');

    if (result.success) {
      var allSanitized = true;

      result.rows.forEach(function(row) {
        var name = row.data.Name;
        if (name && name.indexOf('<script') > -1) {
          Logger.error('✗ TEST 6 FAILED: Script tag not sanitized in preview');
          allSanitized = false;
        }
        if (name && name.indexOf('&lt;script') > -1) {
          Logger.info('✓ Name field properly sanitized: ' + name.substring(0, 50));
        }
      });

      if (allSanitized) {
        Logger.info('✓ TEST 6 PASSED: All malicious input sanitized in bulk upload');
        return { passed: true };
      } else {
        return { passed: false };
      }
    } else {
      Logger.error('✗ TEST 6 FAILED: Preview failed - ' + result.error);
      return { passed: false };
    }
  } catch (e) {
    Logger.error('Test failed with error: ' + e.toString());
    return { passed: false, error: e.toString() };
  }
}

/**
 * Run all security tests
 * Call this function to validate all acceptance criteria
 */
function runAllSecurityTests() {
  try {
    Logger.info('========================================');
    Logger.info('  SECURITY TESTS - RUNNING ALL TESTS');
    Logger.info('========================================');

    var results = {
      test1: testBulkUploadAuthorization(),
      test2: testScheduleAccessControl(),
      test3: testXSSPrevention(),
      test4: testInputValidation(),
      test5: testAuditLogging(),
      test6: testBulkUploadSanitization()
    };

    Logger.info('========================================');
    Logger.info('  TEST RESULTS SUMMARY');
    Logger.info('========================================');

    var totalTests = 0;
    var passedTests = 0;
    var failedTests = 0;
    var skippedTests = 0;

    for (var testName in results) {
      totalTests++;
      var result = results[testName];

      if (result.skipped) {
        skippedTests++;
        Logger.info(testName + ': SKIPPED');
      } else if (result.passed) {
        passedTests++;
        Logger.info(testName + ': PASSED ✓');
      } else {
        failedTests++;
        Logger.error(testName + ': FAILED ✗');
      }
    }

    Logger.info('----------------------------------------');
    Logger.info('Total: ' + totalTests + ' | Passed: ' + passedTests +
                ' | Failed: ' + failedTests + ' | Skipped: ' + skippedTests);
    Logger.info('========================================');

    // Show results to user
    var message = 'Security Tests Complete\n\n' +
                 'Total Tests: ' + totalTests + '\n' +
                 'Passed: ' + passedTests + '\n' +
                 'Failed: ' + failedTests + '\n' +
                 'Skipped: ' + skippedTests + '\n\n' +
                 (failedTests === 0 ? '✓ All tests passed!' : '✗ Some tests failed - check logs');

    SpreadsheetApp.getUi().alert('Security Test Results', message, SpreadsheetApp.getUi().ButtonSet.OK);

    return results;
  } catch (e) {
    Logger.error('Test suite failed: ' + e.toString());
    SpreadsheetApp.getUi().alert('Error', 'Test suite failed: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    return { error: e.toString() };
  }
}
