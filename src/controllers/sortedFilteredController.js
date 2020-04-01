/**
 * External libraries
 */
const _ = require('underscore');

/**
 * Project requirements
 */
const {
  COMMENT_MARGIN_VERTICAL,
  COMMENT_MARGIN_HORIZONTAL,
  ANIMATION_TIME,
  GOOD_COLOR,
  MIDDLE_COLOR,
  BAD_COLOR
} = require('../parameters/constants');
const {
  GRAPH_DISPLAY_ORIENTATION
} = require('../parameters/parameters');

/**
 * When
 */
class SortedFilteredController {
  // --- Vars and accessors
  _graphModel; // Singleton | The GraphModel
  get graphModel() {
    return this._graphModel;
  }
  _graphView; // Singleton | The GraphView
  get graphView() {
    return this._graphView;
  }
  _isInSortedMode; // Boolean |

  // --- Functions
  /**
   * Create the SortedFilteredController
   * @class
   * @returns {SortedFilteredController} this
   */
  constructor() {
    console.log('new SortedFilteredController');
    return this;
  }

  /**
    * Init the SortedFilteredController
    * @access public
    * @param {GraphModel} graphModel - The model of the graph
    * @param {GraphView} graphView - The view of the graph
    * @returns {SortedFilteredController} this
    */
  init(graphModel, graphView) {
    console.log('SortedFilteredController init');
    this._graphModel = graphModel;
    this._graphView = graphView;
    this._isInSortedMode = false;
    return this;
  }

  toggle() {
    if(this._isInSortedMode) {
      this.sortToGraph();
      this._isInSortedMode = false;
    }
    else {
      this.graphToSort();
      this._isInSortedMode = true;
    }
  }

  graphToSort() {
    console.log('graphToSort', $('#relationsContainer'), $('#commentsContainer'));
    $('#relationsContainer').hide();
    $('#commentsContainer').addClass('flex flex-col justify-between');
    $('#commentsContainer').prepend('<div id="container1" class="m-2 flex flex-wrap justify-start"></div>');
    $('#commentsContainer').prepend('<div id="container2" class="m-2 flex flex-wrap justify-start"></div>');

    $('.commentContainer').removeClass('absolute');
    $('.commentContainer.border-3').removeClass('border-3');
    $('.commentContainer.border-solid').removeClass('border-solid');
    $('.commentContainer.rounded').removeClass('rounded');
    $('.commentContainer').addClass('m-2');
    $('.commentContainer').css('left', '');
    $('.commentContainer').css('top', '');
    $('.commentContainer').css('width', '');
    $('.commentContainer .commentBody').css('max-height', '');

    const middle = ($('.commentContainer').length / 2);
    for(var i = 0 ; i < $('.commentContainer').length ; i++) {
      if(i < middle) {
        $('#container1').prepend($('.commentContainer')[i]);
      } else {
        $('#container2').prepend($('.commentContainer')[i]);
      }
    }


  }
  sortToGraph() {
    $('#relationsContainer').show();
    $('#commentsContainer').removeClass('flex');
    $('#commentsContainer').removeClass('flex-col');
    $('.commentContainer').removeClass('m-2');
    $('.commentContainer').addClass('absolute');
    this._graphView.refresh();
  }


}

module.exports = new SortedFilteredController();
