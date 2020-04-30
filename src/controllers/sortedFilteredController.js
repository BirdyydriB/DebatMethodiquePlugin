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
        $('#sortFunctionsContainer').hide();
      }).bind(this));
    });

    // Click on a sort direction icon : alternate from (desc => asc => !active => desc...)
    $('.sortIconContainer').click((e) => {
      const sortFunctionDOM = $(e.currentTarget).closest('.sortFunction');
      this.updateSortFunctionSortDirection(sortFunctionDOM);
    });

    // Modify parameters of a sort function
    $('.sortParameters').click((e) => {
      const sortFunctionDOM = $(e.currentTarget).closest('.sortFunction');
      const sortFunctionView = this._graphView.allSortFunctionsView[sortFunctionDOM.attr('id')];

      if(sortFunctionView.isSelected()) {
        // Parameters opened for this function : close it
        sortFunctionView.unselect();
        $('#sortFunctionParameters').addClass('hidden');
      }
      else {
        // If an other sort function was selected, unselect
        const previousSelected = _.find(this._graphView.allSortFunctionsView, (sortFunctionView) => {
          return sortFunctionView.isSelected();
        });
        if(previousSelected) {
          previousSelected.unselect();
        }
        // Select sort function
        sortFunctionView.select();
        sortFunctionView.refreshParameters(this._graphView._barChart);
        if($('#sortFunctionParameters').hasClass('hidden')) {
          // Sort parameters is hidden : show it
          $('#sortFunctionParameters').removeClass('hidden');
        }
      }
    });

    // Drag and Drop sortFunctions to change theire weight
    $('.sortIconContainer').mousedown((mousedownEvent) => {
      mousedownEvent.stopImmediatePropagation(); // Avoid dragging, when clicking on sortIcon
    });
    $('.sortParameters').mousedown((mousedownEvent) => {
      mousedownEvent.stopImmediatePropagation(); // Avoid dragging, when clicking on sortParameters
    });
    $('.sortFunction').mousedown((mousedownEvent) => {
      this.dragAndDropSortFunction(mousedownEvent);
    });

    return this;
  }

  updateSortFunctionSortDirection(sortFunctionDOM) {
    const sortFunctionView = this._graphView.allSortFunctionsView[sortFunctionDOM.attr('id')];

    if(sortFunctionView.sortFunctionModel.sortDirection == 'desc') {
      // Desc to Asc
      sortFunctionView.sortFunctionModel.sortDirection = 'asc';
    }
    else if(sortFunctionView.sortFunctionModel.sortDirection == 'asc') {
      // Asc to !Active
      sortFunctionView.sortFunctionModel.isActive = false;
      sortFunctionView.sortFunctionModel.sortDirection = '';

      if(sortFunctionView.isSelected()) {
        // Parameters opened for this function : close it
        sortFunctionView.unselect();
        $('#sortFunctionParameters').addClass('hidden');
      }
    }
    else if(!sortFunctionView.sortFunctionModel.isActive) {
      //!Active to Desc
      sortFunctionView.sortFunctionModel.isActive = true;
      sortFunctionView.sortFunctionModel.sortDirection = 'desc';
    }

    sortFunctionView.refresh();
    if(sortFunctionView.isSelected()) {
      // Parameters opened for this function : update it
      sortFunctionView.refreshParameters(this._graphView._barChart);
    }
    this.setSortFunctionsWeight();
    this.showSortContainers();
  }

  dragAndDropSortFunction(mousedownEvent) {
    const sortFunctionDOM = $(mousedownEvent.currentTarget);
    const sortFunctionView = this._graphView.allSortFunctionsView[sortFunctionDOM.attr('id')];
    if(sortFunctionView.sortFunctionModel.isActive) {
      // Create the separator, to visualize the index changes on dragging
      sortFunctionDOM.after('<div id="sortFunctionSeparator" class="border-dashed border-l-2 border-gray-600 ml-1 self-stretched">&nbsp;</div>');

      // Get sort functions positions, to know where to change index
      var positions = [];
      var currentTargetIndex;
      _.each(this._graphView.allSortFunctionsView, (currentSortFunctionView, index) => {
        positions.push(currentSortFunctionView.sortFunctionDOM.position().left + (currentSortFunctionView.sortFunctionDOM.width() / 2));
        if(sortFunctionView.sortFunctionModel.id == currentSortFunctionView.sortFunctionModel.id) {
          currentTargetIndex = index;
        }
      });

      // Create the draggable item, "ghost" clone of sort function clicked
      var sortFunctionClone = sortFunctionDOM.clone();
      const startLeft = sortFunctionDOM.position().left;
      sortFunctionClone.addClass('absolute z-20');
      sortFunctionClone.removeClass('sortFunction');
      sortFunctionClone.css('left', startLeft);
      sortFunctionClone.css('opacity', 0.8);
      sortFunctionClone.appendTo(sortFunctionDOM.parent());

      // On mouse move : drag
      const shiftX = mousedownEvent.clientX;
      var currentSortIndex = 0;
      $(document).mousemove((me) => {
        // Drag sortFunctionClone
        const lastActive = $('.sortFunction.active:last');
        const newLeft = Math.min(
                          lastActive.position().left + lastActive.outerWidth(true) + 10, // Maximum left
                          Math.max(
                            $('.sortFunction:first').position().left, // Minimum left
                            startLeft + (me.clientX - shiftX))
                        );
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
          sortFunctionDOM.insertAfter($('.sortFunction')[currentSortIndex - 1]);
        }
        else {
          sortFunctionDOM.insertBefore($('.sortFunction')[currentSortIndex]);
        }

        // Sort change : recalculate weight and sort comments again
        this.setSortFunctionsWeight();
        this.showSortContainers();
      });
    }
  }

  setSortFunctionsWeight() {
    var childs = $('#allSortFunctions').children('.active');
    for(var weight = childs.length - 1 ; weight >= 0 ; weight--) {
      var sortFilterFunctionDOM = childs[weight];
      $('#allSortFunctions').prepend(sortFilterFunctionDOM);
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
