const sanitizeHtml = require('sanitize-html');

/**
 * Strips all HTML tags and attributes from an input string.
 * Helps prevent Stored XSS attacks.
 * 
 * @param {string} input - The raw user input.
 * @returns {string} - Plain text without any HTML.
 */
const cleanInput = (input) => {
  if (input === undefined || input === null) {
    return '';
  }
  
  if (typeof input !== 'string') {
    return String(input);
  }

  // Use sanitize-html to remove all tags & attributes, keeping only text.
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
};

module.exports = { cleanInput };
