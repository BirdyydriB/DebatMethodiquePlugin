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
const animation_manager = require("../views/animationManager");



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
  _graphNavigator; // Singleton | The GraphNavigator
  get graphNavigator() {
    return this._graphNavigator;
  }
  _isInSortedMode; // Boolean |

  // --- Functions
  /**
   * Create the SortedFilteredController
   * @class
   * @returns {SortedFilteredController} this
   */
  constructor() {
    return this;
  }

  /**
    * Init the SortedFilteredController
    * @access public
    * @param {GraphModel} graphModel - The model of the graph
    * @param {GraphView} graphView - The view of the graph
    * @param {GraphNavigator} graphNavigator - The navigation controller of the graph
    * @returns {SortedFilteredController} this
    */
  init(graphModel, graphView, graphNavigator) {
    console.log('SortedFilteredController init');
    this._graphModel = graphModel;
    this._graphView = graphView;
    this._graphNavigator = graphNavigator;

    this._graphModel.mainSortFunction.classify();
    this.sortCommentsToContainers();
    this._isInSortedMode = false;

    // Each comments : add a listener on goToGraphButton
    _.each(this._graphView.commentsView, (commentView) => {
      commentView.commentView.find('.goToGraphButton').click((function() {
        // Remove outline and hide goToGraphContainer
        this.unselectComment(commentView.commentView);
        // Select comment
        this._graphView.selectedComment = commentView;
        // Swap view to graphView
        this.sortToGraph();
        // Close Sort/Filter menu
        this._isInSortedMode = false;
        $('#filterSortButton').removeClass('active');
        $('#sortFilterBar').hide();
      }).bind(this));
    });

    return this;
  }

  sortCommentsToContainers() {
    _.each(this._graphModel.mainSortFunction.classes, (sortClass) => {
      // Create the flex container
      const sortContainer = $('<div class="sortContainer flex flex-wrap justify-start" color="' + sortClass.color + '"></div>');
      $('#commentsContainer').prepend(sortContainer);

      _.each(sortClass.comments, (commentId) => {
        // Put the comments in the right container
        sortContainer.prepend(this._graphView.commentsView[commentId].commentView);
        // And set header color
        this._graphView.commentsView[commentId].setHeaderColor(sortClass.color);
      });
    });
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
    // Remove graphNavigator listeners (scroll and keyboard) as we are not anymore in Graph mode
    this._graphNavigator.removeListeners();
    // And swap to this Sort/Filter mode, without animation
    animation_manager.animated = false;

    // Hide relations beetween comments
    $('#relationsContainer').hide();
    // And graph coordinates
    $('#graphCoordinates').hide();

    // "show" the sortContainers
    $('#commentsContainer').addClass('flex flex-col justify-between');
    $('.sortContainer').each((index, container) => {
      $(container).addClass('m-2 border-l-3 border-solid rounded');
      $(container).css('border-color', $(container).attr('color'));
    });

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

      // Over/Out a comment : "select" it
      commentView.commentView.mouseenter((function() {
        console.log('select', commentView.commentView);
        this.selectComment(commentView.commentView);

        commentView.commentView.off('mouseleave');
        commentView.commentView.mouseleave((function() {
          console.log('unselect', commentView.commentView);
          this.unselectComment(commentView.commentView);
        }).bind(this));
      }).bind(this));
    });
  }

  selectComment(commentView) {
    commentView.css('outline-color', GOOD_COLOR);
    commentView.addClass('outline-3 outline-solid');
    commentView.find('.goToGraphContainer').removeClass('hidden');
  }
  unselectComment(commentView) {
    commentView.css('outline-color', '');
    commentView.removeClass(['outline-3', 'outline-solid']);
    commentView.find('.goToGraphContainer').addClass('hidden');
  }

  sortToGraph() {
    // Show again relations beetween comments
    $('#relationsContainer').show();
    // And graph coordinates
    $('#graphCoordinates').show();

    // "hide" the sortContainers
    $('#commentsContainer').removeClass(['flex', 'flex-col', 'justify-between']);
    $('.sortContainer').each((index, container) => {
      $(container).removeClass(['m-2', 'border-l-3', 'border-solid', 'rounded']);
      $(container).css('border-color', '');
    });

    _.each(this._graphView.commentsView, (commentView) => {
      // Position will be calculated again
      commentView.commentView.addClass('absolute');
      commentView.commentView.removeClass('m-2');
      // Hide again comments that should be hidden
      if(!commentView.commentModel.visible) {
        commentView.commentView.hide();
      }
      // Remove Over/Out "selection"
      commentView.commentView.off('mouseenter');
      commentView.commentView.off('mouseleave');
    });

    // Force "reset" of selection, to re-build Graph
    const selectedComment = this._graphView.selectedComment;
    this._graphView.selectedComment = null;
    this._graphNavigator.selectComment(selectedComment, false);
    this._graphNavigator.selectCommentUpdateModel();

    // Add scroll and keyboard listeners again, for graph navigation
    this._graphNavigator.addListeners();

    // We can animate graph again
    animation_manager.animated = true;
  }


}

module.exports = new SortedFilteredController();
