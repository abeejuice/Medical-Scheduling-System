/**
 * FuzzyMatcher - Handles fuzzy name matching for faculty identification
 * Uses Levenshtein distance and handles common variations (Dr., titles, etc.)
 */
var FuzzyMatcher = (function() {
  var instance;
  var logger = Logger.getInstance();

  function createInstance() {
    return {
      /**
       * Find matching faculty by name with fuzzy matching
       * @param {string} inputName - Name to match
       * @param {Array} facultyList - Array of faculty objects with Name property
       * @param {number} threshold - Confidence threshold (0-100), default 85
       * @returns {Object} Match result with suggestions
       */
      matchFaculty: function(inputName, facultyList, threshold) {
        threshold = threshold || 85;

        if (!inputName || inputName.trim().length === 0) {
          return {
            matched: false,
            confidence: 0,
            suggestions: []
          };
        }

        var normalizedInput = this._normalizeName(inputName);
        var matches = [];

        for (var i = 0; i < facultyList.length; i++) {
          var faculty = facultyList[i];
          var normalizedFaculty = this._normalizeName(faculty.data.Name);

          // Calculate similarity
          var confidence = this._calculateSimilarity(normalizedInput, normalizedFaculty);

          // Also check partial matches (last name only, first name only)
          var partialConfidence = this._checkPartialMatch(normalizedInput, normalizedFaculty);
          confidence = Math.max(confidence, partialConfidence);

          if (confidence >= threshold) {
            matches.push({
              faculty: faculty,
              confidence: confidence,
              originalName: faculty.data.Name,
              matchType: confidence === 100 ? 'exact' : 'fuzzy'
            });
          }
        }

        // Sort by confidence descending
        matches.sort(function(a, b) { return b.confidence - a.confidence; });

        if (matches.length === 0) {
          return {
            matched: false,
            confidence: 0,
            inputName: inputName,
            suggestions: []
          };
        }

        var topMatch = matches[0];

        return {
          matched: true,
          confidence: topMatch.confidence,
          inputName: inputName,
          matchedFaculty: topMatch.faculty,
          matchType: topMatch.matchType,
          suggestions: matches.slice(0, 3) // Return top 3 suggestions
        };
      },

      /**
       * Normalize name for comparison
       * @param {string} name - Name to normalize
       * @returns {string} Normalized name
       */
      _normalizeName: function(name) {
        if (!name) return '';

        name = name.toLowerCase().trim();

        // Remove titles
        var titles = ['dr.', 'dr', 'prof.', 'prof', 'professor', 'mr.', 'mr', 'mrs.', 'mrs',
                     'ms.', 'ms', 'miss', 'sir', 'madam'];

        for (var i = 0; i < titles.length; i++) {
          var titlePattern = new RegExp('\\b' + titles[i] + '\\s*', 'gi');
          name = name.replace(titlePattern, '');
        }

        // Remove extra whitespace
        name = name.replace(/\s+/g, ' ').trim();

        // Remove punctuation
        name = name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

        return name;
      },

      /**
       * Check for partial name matches (first or last name only)
       * @param {string} input - Input name
       * @param {string} target - Target name
       * @returns {number} Confidence score (0-100)
       */
      _checkPartialMatch: function(input, target) {
        var inputParts = input.split(' ');
        var targetParts = target.split(' ');

        if (inputParts.length === 0 || targetParts.length === 0) {
          return 0;
        }

        var maxConfidence = 0;

        // Check if any input part matches any target part exactly
        for (var i = 0; i < inputParts.length; i++) {
          for (var j = 0; j < targetParts.length; j++) {
            if (inputParts[i] === targetParts[j] && inputParts[i].length > 2) {
              // Exact match on a name component
              var confidence = 70; // Base confidence for partial match

              // Boost confidence if it's likely a last name (longer, at the end)
              if (i === inputParts.length - 1 && j === targetParts.length - 1) {
                confidence = 80;
              }

              maxConfidence = Math.max(maxConfidence, confidence);
            } else {
              // Check similarity between parts
              var partConfidence = this._calculateSimilarity(inputParts[i], targetParts[j]);
              if (partConfidence > 85) {
                maxConfidence = Math.max(maxConfidence, 75);
              }
            }
          }
        }

        return maxConfidence;
      },

      /**
       * Calculate similarity between two strings using Levenshtein distance
       * @param {string} str1 - First string
       * @param {string} str2 - Second string
       * @returns {number} Similarity percentage (0-100)
       */
      _calculateSimilarity: function(str1, str2) {
        if (str1 === str2) return 100;
        if (str1.length === 0 || str2.length === 0) return 0;

        var distance = this._levenshteinDistance(str1, str2);
        var maxLength = Math.max(str1.length, str2.length);
        var similarity = (1 - distance / maxLength) * 100;

        return Math.round(similarity);
      },

      /**
       * Calculate Levenshtein distance between two strings
       * @param {string} str1 - First string
       * @param {string} str2 - Second string
       * @returns {number} Levenshtein distance
       */
      _levenshteinDistance: function(str1, str2) {
        var matrix = [];

        // Initialize matrix
        for (var i = 0; i <= str2.length; i++) {
          matrix[i] = [i];
        }

        for (var j = 0; j <= str1.length; j++) {
          matrix[0][j] = j;
        }

        // Fill matrix
        for (var i = 1; i <= str2.length; i++) {
          for (var j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1,     // insertion
                matrix[i - 1][j] + 1      // deletion
              );
            }
          }
        }

        return matrix[str2.length][str1.length];
      },

      /**
       * Batch match multiple names
       * @param {Array} names - Array of names to match
       * @param {Array} facultyList - Array of faculty objects
       * @param {number} threshold - Confidence threshold
       * @returns {Array} Array of match results
       */
      batchMatch: function(names, facultyList, threshold) {
        var results = [];

        for (var i = 0; i < names.length; i++) {
          var result = this.matchFaculty(names[i], facultyList, threshold);
          results.push(result);
        }

        logger.info('Batch name matching completed', {
          totalNames: names.length,
          matched: results.filter(function(r) { return r.matched; }).length,
          threshold: threshold
        });

        return results;
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
