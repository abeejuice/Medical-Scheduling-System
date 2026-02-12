/**
 * SecurityUtils - Input validation and sanitization utilities
 * Provides XSS prevention, input validation, and sanitization
 */
var SecurityUtils = (function() {
  'use strict';

  /**
   * HTML entity map for escaping
   */
  var HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  /**
   * Escape HTML special characters to prevent XSS
   * Converts <script> to &lt;script&gt; so it renders as text
   * @param {string} input - Raw user input
   * @return {string} Sanitized output
   */
  function escapeHtml(input) {
    if (input == null || input === '') {
      return '';
    }

    return String(input).replace(/[&<>"'\/]/g, function(char) {
      return HTML_ENTITIES[char];
    });
  }

  /**
   * Sanitize user input by escaping HTML and trimming whitespace
   * @param {string} input - Raw user input
   * @return {string} Sanitized output
   */
  function sanitizeInput(input) {
    if (input == null || input === '') {
      return '';
    }

    var sanitized = String(input).trim();
    sanitized = escapeHtml(sanitized);
    return sanitized;
  }

  /**
   * Sanitize an object's string properties
   * @param {Object} obj - Object with properties to sanitize
   * @return {Object} Object with sanitized properties
   */
  function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    var sanitized = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var value = obj[key];
        if (typeof value === 'string') {
          sanitized[key] = sanitizeInput(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  }

  /**
   * Sanitize an array of values
   * @param {Array} arr - Array to sanitize
   * @return {Array} Sanitized array
   */
  function sanitizeArray(arr) {
    if (!Array.isArray(arr)) {
      return arr;
    }

    return arr.map(function(item) {
      if (typeof item === 'string') {
        return sanitizeInput(item);
      } else if (typeof item === 'object' && item !== null) {
        return Array.isArray(item) ? sanitizeArray(item) : sanitizeObject(item);
      }
      return item;
    });
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @return {boolean} True if valid email format
   */
  function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate that input doesn't contain script tags or other dangerous content
   * @param {string} input - Input to check
   * @return {Object} { isValid: boolean, reason: string }
   */
  function validateNoScriptTags(input) {
    if (!input || typeof input !== 'string') {
      return { isValid: true, reason: null };
    }

    var lowerInput = input.toLowerCase();

    // Check for script tags
    if (lowerInput.indexOf('<script') > -1 || lowerInput.indexOf('</script>') > -1) {
      return { isValid: false, reason: 'Script tags are not allowed' };
    }

    // Check for event handlers
    var eventHandlers = ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur'];
    for (var i = 0; i < eventHandlers.length; i++) {
      if (lowerInput.indexOf(eventHandlers[i]) > -1) {
        return { isValid: false, reason: 'Event handlers are not allowed' };
      }
    }

    // Check for javascript: protocol
    if (lowerInput.indexOf('javascript:') > -1) {
      return { isValid: false, reason: 'JavaScript protocol is not allowed' };
    }

    // Check for data: protocol with script
    if (lowerInput.indexOf('data:') > -1 && lowerInput.indexOf('script') > -1) {
      return { isValid: false, reason: 'Data protocol with script is not allowed' };
    }

    return { isValid: true, reason: null };
  }

  /**
   * Validate string length
   * @param {string} input - Input to validate
   * @param {number} maxLength - Maximum allowed length
   * @return {Object} { isValid: boolean, reason: string }
   */
  function validateLength(input, maxLength) {
    if (!input || typeof input !== 'string') {
      return { isValid: true, reason: null };
    }

    if (input.length > maxLength) {
      return {
        isValid: false,
        reason: 'Input exceeds maximum length of ' + maxLength + ' characters'
      };
    }

    return { isValid: true, reason: null };
  }

  /**
   * Comprehensive input validation
   * @param {string} input - Input to validate
   * @param {Object} options - Validation options
   * @return {Object} { isValid: boolean, sanitized: string, errors: Array }
   */
  function validateInput(input, options) {
    options = options || {};
    var errors = [];
    var sanitized = input;

    // Check for required field
    if (options.required && (!input || input.trim().length === 0)) {
      errors.push('Field is required');
      return { isValid: false, sanitized: '', errors: errors };
    }

    // Skip further validation if empty and not required
    if (!input || input.trim().length === 0) {
      return { isValid: true, sanitized: '', errors: [] };
    }

    // Validate length
    if (options.maxLength) {
      var lengthCheck = validateLength(input, options.maxLength);
      if (!lengthCheck.isValid) {
        errors.push(lengthCheck.reason);
      }
    }

    // Validate no script tags
    var scriptCheck = validateNoScriptTags(input);
    if (!scriptCheck.isValid) {
      errors.push(scriptCheck.reason);
    }

    // Validate email format if specified
    if (options.isEmail && !isValidEmail(input)) {
      errors.push('Invalid email format');
    }

    // Sanitize the input
    sanitized = sanitizeInput(input);

    return {
      isValid: errors.length === 0,
      sanitized: sanitized,
      errors: errors
    };
  }

  /**
   * Strip all HTML tags from input (more aggressive than escaping)
   * @param {string} input - Input with potential HTML
   * @return {string} Plain text output
   */
  function stripHtmlTags(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove all HTML tags
    return input.replace(/<[^>]*>/g, '');
  }

  return {
    escapeHtml: escapeHtml,
    sanitizeInput: sanitizeInput,
    sanitizeObject: sanitizeObject,
    sanitizeArray: sanitizeArray,
    isValidEmail: isValidEmail,
    validateNoScriptTags: validateNoScriptTags,
    validateLength: validateLength,
    validateInput: validateInput,
    stripHtmlTags: stripHtmlTags
  };
})();
