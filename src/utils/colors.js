/**
 * Project requirements
 */
const {
  ACCESSIBILITY_COLOR_CONTRAST
} = require('../parameters/parameters');

/**
  * Return the color in a gradient btw 3 values
  * @access public
  * @param {string} color1 - The first gradient color
  * @param {string} color2 - The second gradient color
  * @param {string} color3 - The third gradient color
  * @param {number} percent - Where to get the color in the gradient
  * @returns {string} The color
  */
function getGradientColor(color1, color2, color3, percent) {
  startColor = color1;
  endColor = color2;

  var fade = percent * 2;
  if (fade >= 1) {
    fade -= 1;
    startColor = color2;
    endColor = color3;
  }

  if (startColor.slice(0, 1) === '#') {
		startColor = startColor.slice(1);
	}
  if (endColor.slice(0, 1) === '#') {
		endColor = endColor.slice(1);
	}

  // Get colors
  var startRed = parseInt(startColor.substr(0, 2), 16),
    startGreen = parseInt(startColor.substr(2, 2), 16),
    startBlue = parseInt(startColor.substr(4, 2), 16);

  var end_red = parseInt(endColor.substr(0, 2), 16),
    end_green = parseInt(endColor.substr(2, 2), 16),
    end_blue = parseInt(endColor.substr(4, 2), 16);

  // Calculate new color
  var diffRed = end_red - startRed;
  var diffGreen = end_green - startGreen;
  var diffBlue = end_blue - startBlue;

  diffRed = ((diffRed * fade) + startRed).toString(16).split('.')[0];
  diffGreen = ((diffGreen * fade) + startGreen).toString(16).split('.')[0];
  diffBlue = ((diffBlue * fade) + startBlue).toString(16).split('.')[0];

  // Ensure 2 digits by color
  if (diffRed.length == 1) diffRed = '0' + diffRed
  if (diffGreen.length == 1) diffGreen = '0' + diffGreen
  if (diffBlue.length == 1) diffBlue = '0' + diffBlue

  return '#' + diffRed + diffGreen + diffBlue;
}

/**
  * Get the contrasting color for any hex color
  * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
  * Derived from work by Brian Suda, https://24ways.org/2010/calculating-color-contrast/
  * @access private
  * @param {string} color - A hexcolor value
  * @returns {string} The contrasting color (#000000 or #ffffff)
  */
function getContrast(color) {
  if (color.slice(0, 1) === '#') {
		color = color.slice(1);
	}

	// Convert to RGB value
	var r = parseInt(color.substr(0, 2), 16);
	var g = parseInt(color.substr(2, 2), 16);
	var b = parseInt(color.substr(4, 2), 16);

	// Get YIQ ratio
	var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

	// Check contrast
	return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

/**
  * Get the complementary color for any hex color (Andy Warhol style)
  * @access private
  * @param {string} color - A hexcolor value
  * @returns {string} The complementary color
  */
function getComplementaryColor(color) {
  const hexColor = color.replace('#', '0x');
  return `#${('000000' + (('0xFFFFFF' ^ hexColor).toString(16))).slice(-6)}`;
}

/**
  * Get the text color for a given background color, based on ACCESSIBILITY_COLOR_CONTRAST
  * @access public
  * @param {string} color - The background color
  * @returns {string} The text color
  */
function getTextColorFromBackgroundColor(color) {
  switch (ACCESSIBILITY_COLOR_CONTRAST.currentValue) {
    case 'NONE':
      return '#FFFFFF';
      break;
    case 'CONTRASTED':
      return getContrast(color);
      break;
    case 'COMPLEMENTARY':
      return getComplementaryColor(color);
      break;
    default:
  }
}

module.exports = {
  getGradientColor: getGradientColor,
  getTextColorFromBackgroundColor: getTextColorFromBackgroundColor
};
