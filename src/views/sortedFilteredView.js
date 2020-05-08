/**
 * External libraries
 */
const _ = require('underscore');

/**
 * Project requirements
 */
const {
   GOOD_COLOR
} = require('../parameters/constants');
const sortFunction_view = require("../views/sortFunctionView");
const sortFunction_barChart = require("../utils/barChart");

/**
 * When
 */
class SortedFilteredView {
  // --- Vars and accessors
  _graphModel; // Singleton | The GraphModel
  get graphModel() {
    return this._graphModel;
  }
  _graphView; // Singleton | The GraphView
  get graphView() {
    return this._graphView;
  }

  _allSortFunctionsView;
  get allSortFunctionsView() {
    return this._allSortFunctionsView;
  }
  _barChart;
  get barChart() {
    return this._barChart;
  }
  _sortFunctionSelected;
  get sortFunctionSelected() {
    return this._sortFunctionSelected;
  }

  // --- Functions
  /**
   * Create the SortedFilteredView
   * @class
   * @returns {SortedFilteredView} this
   */
  constructor() {
    this._allSortFunctionsView = {};
    return this;
  }

  /**
    * Init the SortedFilteredView
    * @access public
    * @param {GraphModel} graphModel - The model of the graph
    * @param {GraphView} graphView - The view of the graph
    * @returns {SortedFilteredView} this
    */
  init(graphModel, graphView) {
    console.log('SortedFilteredView init');
    this._graphModel = graphModel;
    this._graphView = graphView;

    // Create sort function views
    _.each(this._graphModel.mainSortFunction.allSortFunctions, (sortFunctionModel) => {
      const sortFunctionView = new sortFunction_view.SortFunctionView(sortFunctionModel)
        .init($('#allSortFunctions'));
      this._allSortFunctionsView[sortFunctionModel.id] = sortFunctionView;
    });

    this._barChart = new sortFunction_barChart.BarChart()
      .init('#sortFunctionDistributionBarChart');

    return this;
  }

  updateSortFunctionSlider(sliderValue) {
    $('output[for="sortFunctionSlider"]').val(sliderValue);
  }

  sortCommentsToContainers() {
    $('.commentContainer').prependTo($('#commentsContainer'));
    $('.sortContainer').remove();

    for(var i = 0 ; i < this._graphModel.mainSortFunction.classes.length ; i++) {
      const sortClass = this._graphModel.mainSortFunction.classes[i];

      // Create the flex container
      const sortContainer = $('<div class="sortContainer flex flex-wrap justify-start" color="' + sortClass.color + '"></div>');
      $('#commentsContainer').prepend(sortContainer);

      _.each(sortClass.comments, (commentId) => {
        // Show in case of hided comment
        this._graphView.commentsView[commentId].commentView.show();
        // Put the comments in the right container
        sortContainer.prepend(this._graphView.commentsView[commentId].commentView);
        // And set header color
        this._graphView.commentsView[commentId].setHeaderColor(sortClass.color);
      });
    }

    // Hide filtered comments
    _.each(this._graphModel.mainSortFunction.filteredComments, (sortFunctionId, commentId) => {
      this._graphView.commentsView[commentId].setHeaderColor('');
      this._graphView.commentsView[commentId].commentView.hide();
    });
  }

  selectSortFunction(sortFunctionView) {
    // If an other sort function was selected, unselect
    if(this._sortFunctionSelected) {
      this._sortFunctionSelected.unselect();
    }
    this._sortFunctionSelected = sortFunctionView;
    sortFunctionView.select();
    sortFunctionView.renderParameters(this._barChart);
  }

  unselectSortFunction(sortFunctionView) {
    if(sortFunctionView.isSelected()) {
      this._sortFunctionSelected = null;
      sortFunctionView.unselect();
      $('#sortFunctionParameters').addClass('hidden');
    }
  }

  showSortContainers() {
    $('#commentsContainer').addClass('flex flex-col justify-between');
    $('.sortContainer').each((index, container) => {
      $(container).addClass('m-2 border-l-3 border-solid rounded');
      $(container).css('border-color', $(container).attr('color'));
    });
  }

  hideSortContainers() {
    $('#commentsContainer').removeClass(['flex', 'flex-col', 'justify-between']);
    $('.sortContainer').each((index, container) => {
      $(container).removeClass(['m-2', 'border-l-3', 'border-solid', 'rounded']);
      $(container).css('border-color', '');
    });
  }

  graphToSort() {
    // Hide relations beetween comments
    $('#relationsContainer').hide();
    // And graph coordinates
    $('#graphCoordinates').hide();

    this.showSortContainers();

    _.each(this._graphView.commentsView, (commentView) => {
      // Remove comment selection, only available in Graph mode
      if(commentView.selected) {
        commentView.unselect();
      }
      if(commentView.selectedAsParent) {
        commentView.unselectAsParent();
      }
      if(commentView.selectedAsChild) {
        commentView.unselectAsChild();
      }
      // All comments in Sort/Filter mode are visible
      if(!commentView.visible) {
        commentView.commentView.show();
      }
      // And have the same size
      if(commentView.isExpanded) {
        commentView.resize();
      }

      // Position of comment in this Sort/Filter mode, is not calculated like in Graph mode
      commentView.commentView.removeClass('absolute');
      commentView.commentView.css('left', '');
      commentView.commentView.css('top', '');
      commentView.commentView.addClass('m-2');
    });
  }

  sortToGraph() {
    // Show again relations beetween comments
    $('#relationsContainer').show();
    // And graph coordinates
    $('#graphCoordinates').show();

    this.hideSortContainers();

    _.each(this._graphView.commentsView, (commentView) => {
      // Position will be calculated again
      commentView.commentView.addClass('absolute');
      commentView.commentView.removeClass('m-2');

      // Hide again comments that should be hidden
      if(!commentView.commentModel.visible) {
        commentView.commentView.hide();
      }
    });
  }

  selectComment(commentView) {
    commentView.css('outline-color', GOOD_COLOR);
    commentView.addClass('outline-3 outline-solid');
  }

  unselectComment(commentView) {
    commentView.css('outline-color', '');
    commentView.removeClass(['outline-3', 'outline-solid']);
  }


}

module.exports = new SortedFilteredView();
