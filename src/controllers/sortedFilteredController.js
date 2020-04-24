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
    this._isInSortedMode = false;

    this.setSortFunctionsWeight();

    // Each comments : add a listener on selectCommentButton
    _.each(this._graphView.commentsView, (commentView) => {
      commentView.commentView.find('.selectCommentButton-sort').click((() => {
        // Remove outline and hide goToGraphContainer
        this.unselectComment(commentView.commentView);
        // Select comment
        this._graphView.setSelectedComment(commentView);
        // Swap view to graphView
        this.sortToGraph();
        // Close Sort/Filter menu
        this._isInSortedMode = false;
        $('#filterSortButton').removeClass('active');
        $('#sortFilterBar').hide();
      }).bind(this));
    });

    // Click on a sort direction icon : alternate from (desc => asc => !active => desc...)
    $('.sortIconContainer').click((e) => {
      const sortFunctionDOM = $(e.currentTarget).closest('.sortFunction');
      const sortFunctionView = this._graphView.allSortFunctionsView[sortFunctionDOM.attr('id')];

      if(sortFunctionView.sortFunctionModel.sortDirection == 'desc') {
        sortFunctionDOM.removeClass('goodToBadColor');
        sortFunctionDOM.addClass('badToGoodColor');
        sortFunctionView.sortFunctionModel.sortDirection = 'asc';
        $(e.currentTarget).find('.sortIconDown').addClass('hidden');
        $(e.currentTarget).find('.sortIconUp').removeClass('hidden');
      }
      else if(sortFunctionView.sortFunctionModel.sortDirection == 'asc') {
        sortFunctionDOM.removeClass('badToGoodColor');
        sortFunctionDOM.addClass('bg-gray-400');
        sortFunctionDOM.removeClass(['active', 'cursor-move']);
        sortFunctionView.sortFunctionModel.isActive = false;
        sortFunctionView.sortFunctionModel.sortDirection = '';
        $(e.currentTarget).find('.sortIconUp').addClass('hidden');
        $(e.currentTarget).find('.sortIconNone').removeClass('hidden');
      }
      else if(!sortFunctionView.sortFunctionModel.isActive) {
        sortFunctionDOM.removeClass('bg-gray-400');
        sortFunctionDOM.addClass('active cursor-move');
        sortFunctionDOM.addClass('goodToBadColor');
        sortFunctionView.sortFunctionModel.isActive = true;
        sortFunctionView.sortFunctionModel.sortDirection = 'desc';
        $(e.currentTarget).find('.sortIconNone').addClass('hidden');
        $(e.currentTarget).find('.sortIconDown').removeClass('hidden');
      }

      this.setSortFunctionsWeight();
      this.showSortContainers();
    });

    // Drag and Drop sortFunctions to change theire weight
    $('.sortIconContainer').mousedown((mousedownEvent) => {
      mousedownEvent.stopImmediatePropagation(); // Avoid dragging, when clicking on sortIcon
    });
    $('.sortFunction').mousedown((mousedownEvent) => {
      if($(mousedownEvent.currentTarget).hasClass('active')) {
        // Create the separator, to visualize the index changes on dragging
        $(mousedownEvent.currentTarget).after('<div id="sortFunctionSeparator" class="border-dashed border-l-2 border-gray-600 ml-1 self-stretched">&nbsp;</div>');

        // Get sort functions positions, to know where to change index
        var positions = [];
        var currentTargetIndex;
        _.each($('.sortFunction'), (sortFunction, index) => {
          positions.push($(sortFunction).position().left + ($(sortFunction).width() / 2));
          if($(sortFunction).attr('id') == $(mousedownEvent.currentTarget).attr('id')) {
            currentTargetIndex = index;
          }
        });

        // Create the draggable item, "ghost" clone of sort function clicked
        var sortFunctionClone = $(mousedownEvent.currentTarget).clone();
        const startLeft = $(mousedownEvent.currentTarget).position().left;
        sortFunctionClone.addClass('absolute z-20');
        sortFunctionClone.removeClass('sortFunction');
        sortFunctionClone.css('left', startLeft);
        sortFunctionClone.css('opacity', 0.8);
        sortFunctionClone.appendTo($(mousedownEvent.currentTarget).parent());

        // On mouse move : drag
        const shiftX = mousedownEvent.clientX;
        var currentSortIndex = 0;
        $(document).mousemove((me) => {
          // Drag sortFunctionClone
          const newLeft = Math.max($('.sortFunction:first').position().left, startLeft + (me.clientX - shiftX));
          sortFunctionClone.css('left', newLeft);

          // Get (child) index where we have to insert separator
          currentSortIndex = _.sortedIndex(positions, newLeft);
          if(currentSortIndex == currentTargetIndex) {
            // Jump index if we are over currentTarget
            currentSortIndex++;
          }
          // Insert separator at right index
          if(currentSortIndex == $('.sortFunction').length) {
            $('#sortFunctionSeparator').insertAfter($('.sortFunction')[currentSortIndex - 1]);
          }
          else {
            $('#sortFunctionSeparator').insertBefore($('.sortFunction')[currentSortIndex]);
          }
        });

        // Mouse up : drop at right index
        $(document).mouseup((mouseupEvent) => {
          // Remove listeners
          $(document).off('mousemove');
          $(document).off('mouseup');
          // And UI helpers
          sortFunctionClone.remove();
          $('#sortFunctionSeparator').remove();
          // Drop at right index
          if(currentSortIndex == $('.sortFunction').length) {
            $(mousedownEvent.currentTarget).insertAfter($('.sortFunction')[currentSortIndex - 1]);
          }
          else {
            $(mousedownEvent.currentTarget).insertBefore($('.sortFunction')[currentSortIndex]);
          }

          // Sort change : recalculate weight and sort comments again
          this.setSortFunctionsWeight();
          this.showSortContainers();
        });
      }
    });

    return this;
  }

  setSortFunctionsWeight() {
    var childs = $('#sortFilterBar').children('.active');
    for(var weight = childs.length - 1 ; weight >= 0 ; weight--) {
      var sortFilterFunctionDOM = childs[weight];
      $('#sortFilterBar').prepend(sortFilterFunctionDOM);
      const sortFunction = this._graphModel.mainSortFunction.allSortFunctions[$(sortFilterFunctionDOM).attr('id')];
      sortFunction.weight = childs.length - weight;
    }
    // Weights change : sort again
    this._graphModel.mainSortFunction.classify();
    this.sortCommentsToContainers();
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
        // Put the comments in the right container
        sortContainer.prepend(this._graphView.commentsView[commentId].commentView);
        // And set header color
        this._graphView.commentsView[commentId].setHeaderColor(sortClass.color);
      });
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

  toggleSortMode() {
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

      // Switch selectCommentButtons, making click right behaviour
      commentView.commentView.find('.selectCommentButton-sort').removeClass('hidden');
      commentView.commentView.find('.selectCommentButton-graph').addClass('hidden');

      // Over/Out a comment : "select" it
      commentView.commentView.mouseenter((function() {
        this.selectComment(commentView.commentView);

        commentView.commentView.off('mouseleave');
        commentView.commentView.mouseleave((function() {
          this.unselectComment(commentView.commentView);
        }).bind(this));
      }).bind(this));
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

      // Switch selectCommentButtons, making click right behaviour
      commentView.commentView.find('.selectCommentButton-graph').removeClass('hidden');
      commentView.commentView.find('.selectCommentButton-sort').addClass('hidden');

      // Remove Over/Out "selection"
      commentView.commentView.off('mouseenter');
      commentView.commentView.off('mouseleave');
    });

    // Force "reset" of selection, to re-build Graph
    const selectedComment = this._graphView.selectedComment;
    this._graphView.setSelectedComment(null);
    this._graphNavigator.selectComment(selectedComment);
    this._graphNavigator.selectCommentUpdateModel();

    // Add scroll and keyboard listeners again, for graph navigation
    this._graphNavigator.addListeners();

    // We can animate graph again
    animation_manager.animated = true;
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

module.exports = new SortedFilteredController();
