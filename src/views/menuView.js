/**
 * External libraries
 */
var _ = require('underscore');

/**
 * Project requirements
 */
const {
   GOOD_COLOR
} = require('../parameters/constants');
var template_menu = require("../templates/menu");

/**
 * Class Definition
 */
class MenuView {
  // --- Vars and accessors
  _graphModel; // Singleton | The GraphModel
  get graphModel() {
    return this._graphModel;
  }

  // --- Functions
  constructor() {
    return this;
  }
  init(graphModel) {
    console.log('MenuView init');
    this._graphModel = graphModel;

    console.log(this._graphModel.allSortFunctions);
    $('#menuContainer').prepend(_.template(template_menu)({
      articleTitle: articleTitle,
      allSortFunctions: this._graphModel.allSortFunctions
    }));
    $('.sortFunction.isActive').css('background-color', GOOD_COLOR);
    $('#menuContainer #sortFilterBar').hide();

    $('#menuContainer #centerSelectedButton').css('color', GOOD_COLOR);

    return this;
  }

}

module.exports = new MenuView();
