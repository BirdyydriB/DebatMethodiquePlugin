/**
 * External libraries
 */
const _ = require('underscore');
const d3 = require('d3');

/**
 * Project requirements
 */
const colors = require('../utils/colors');
const localize = require('../parameters/localization/localize');
const template_sortFunction = require('../templates/sortFunction.pug');

/**
 * Class Definition
 */
class SortFunctionView {
  // --- Vars and accessors
  _sortFunctionModel; // SortFunction | The sortFunction related to this view
  get sortFunctionModel() {
    return this._sortFunctionModel;
  }
  _sortFunctionDOM;
  get sortFunctionDOM() {
    return this._sortFunctionDOM;
  }

  // --- Functions
  constructor(sortFunctionModel) {
    this._sortFunctionModel = sortFunctionModel;
    return this;
  }

  init(sortFunctionContainer) {
    this._sortFunctionDOM = $(template_sortFunction({
      sort_class: 'float-left',
      sort_id: this._sortFunctionModel.id,
      sort_name: this._sortFunctionModel.label,
      sort_isActive: this._sortFunctionModel.isActive,
      sort_direction: this._sortFunctionModel.sortDirection,
    }));
    sortFunctionContainer.append(this._sortFunctionDOM);

    return this;
  }

  refresh() {
    if(this._sortFunctionModel.isActive) {
      this._sortFunctionDOM.removeClass('bg-gray-400');
      this._sortFunctionDOM.find('.sortParameters').removeClass('hidden');

      if(this._sortFunctionModel.sortDirection == 'asc') {
        this._sortFunctionDOM.addClass('badToGoodColor active cursor-move');
        this._sortFunctionDOM.removeClass('goodToBadColor');
        this._sortFunctionDOM.find('.sortIconUp').removeClass('hidden');
        this._sortFunctionDOM.find('.sortIconDown').addClass('hidden');
        this._sortFunctionDOM.find('.sortIconNone').addClass('hidden');
      }
      else {
        this._sortFunctionDOM.addClass('goodToBadColor active cursor-move');
        this._sortFunctionDOM.removeClass('badToGoodColor');
        this._sortFunctionDOM.find('.sortIconUp').addClass('hidden');
        this._sortFunctionDOM.find('.sortIconDown').removeClass('hidden');
        this._sortFunctionDOM.find('.sortIconNone').addClass('hidden');
      }
    }
    else {
      this._sortFunctionDOM.removeClass(['badToGoodColor', 'goodToBadColor', 'active', 'cursor-move']);
      this._sortFunctionDOM.addClass('bg-gray-400');
      this._sortFunctionDOM.find('.sortIconUp').addClass('hidden');
      this._sortFunctionDOM.find('.sortIconDown').addClass('hidden');
      this._sortFunctionDOM.find('.sortIconNone').removeClass('hidden');
      this._sortFunctionDOM.find('.sortParameters').addClass('hidden');
    }
  }

  refreshParameters(barChart) {
    $('#sortFunctionSlider').val(this._sortFunctionModel.relativeDiffMax * 100);
    $('output[for="sortFunctionSlider"]').val(Math.floor(this._sortFunctionModel.relativeDiffMax * 100));

    barChart.setDatas(this._sortFunctionModel.sortedCommentsScore, this._sortFunctionModel.classes, localize('SORT_FUNCTION_BARCHART_X_LABEL'), this._sortFunctionModel.measurementLabel);
    if((this._sortFunctionModel.sortDirection == 'asc')) {
      barChart.changeSort();
    }
    barChart.render();
  }

  isSelected() {
    return this._sortFunctionDOM.hasClass('selected');
  }

  select() {
    this._sortFunctionDOM.addClass('selected');
  }

  unselect() {
    this._sortFunctionDOM.removeClass('selected');
  }

  addClassReminder(commentId, DOMElement) {
    DOMElement.addClass(this._sortFunctionModel.id);
    DOMElement.attr('commentId', commentId);
  }

  hideAllClassReminders() {
    _.each($('.' + this._sortFunctionModel.id), (DOMElement) => {
      $(DOMElement).css('background-color', '');
      $(DOMElement).css('color', '');
    });
  }

  showAllClassReminders() {
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
