/**
 * Project requirements
 */
const {
  LANG
} = require('../parameters');
const fr = require('./fr');
const en = require('./en');

/**
  * Localize a text
  * @access public
  * @param {string} strKey - The key of the text to localize
  * @returns {string} the localized text
  */
function localize(strKey) {
  var result = ((lang) => {
    switch (lang) {
      case 'fr':
        return fr[strKey];
        break;
      case 'en':
        return en[strKey];
        break;
      default:
    }
  })(LANG.currentValue);

  for(var i = 1 ; i < arguments.length ; i++) {
    result = result.replace('%v', arguments[i]);
  }

  return result;
}

module.exports = localize;
