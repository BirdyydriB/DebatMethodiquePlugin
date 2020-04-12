/**
 * External libraries
 */
const _ = require('underscore');

/**
 * Project requirements
 */
const colors = require("../utils/colors");

/**
 * Class Definition
 */
class SortFunctionView {
  // --- Vars and accessors
  _sortFunctionModel; // SortFunction | The sortFunction related to this view
  get sortFunctionModel() {
    return this._sortFunctionModel;
  }

  // --- Functions
  constructor(sortFunctionModel) {
    this._sortFunctionModel = sortFunctionModel;
    return this;
  }

  add(commentId, DOMElement) {
    DOMElement.addClass(this._sortFunctionModel.id);
    DOMElement.attr('commentId', commentId);
  }

  hideAll() {
    _.each($('.' + this._sortFunctionModel.id), (DOMElement) => {
      $(DOMElement).css('background-color', '');
      $(DOMElement).css('color', '');
    });
  }

  showAll() {
    _.each($('.' + this._sortFunctionModel.id), (DOMElement) => {
      const commentId = $(DOMElement).attr('commentId');
      const commentClass = this._sortFunctionModel.commentsClass[commentId];
      const commentColor = this._sortFunctionModel.classes[commentClass].color;
      $(DOMElement).css('background-color', commentColor);
      $(DOMElement).css('color', colors.getTextColorFromBackgroundColor(commentColor));
    });
  }

}

module.exports = {
  SortFunctionView: SortFunctionView
};
