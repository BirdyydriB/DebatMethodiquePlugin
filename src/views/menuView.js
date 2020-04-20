/**
 * External libraries
 */
const _ = require('underscore');

/**
 * Project requirements
 */
const template_menu = require("../templates/menu.pug");

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

    $('#menuContainer').prepend(template_menu({
      articleTitle: articleTitle,
      allSortFunctions: this._graphModel.mainSortFunction.allSortFunctions
    }));
    $('.sortFunction.isActive').addClass('bg-goodColor');
    $('#menuContainer #sortFilterBar').hide();

    $('#menuContainer #centerSelectedButton').addClass('text-goodColor');

    return this;
  }

}

module.exports = new MenuView();
