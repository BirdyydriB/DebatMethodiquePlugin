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
  _sortedFilteredView; // Singleton | The SortedFilteredView
  get sortedFilteredView() {
    return this._sortedFilteredView;
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
    * @param {SortedFilteredView} sortedFilteredView - The SortedFilteredView
    * @param {GraphNavigator} graphNavigator - The navigation controller of the graph
    * @returns {SortedFilteredController} this
    */
  init(sortedFilteredView, graphNavigator) {
    console.log('SortedFilteredController init');
    this._sortedFilteredView = sortedFilteredView;
    this._graphNavigator = graphNavigator;
    this._isInSortedMode = false;

    // Each comments : add a listener on selectCommentButton
    _.each(this._sortedFilteredView.graphView.commentsView, (commentView) => {
      commentView.commentView.find('.selectCommentButton-sort').click((() => {
        // Remove outline and hide goToGraphContainer
        this._sortedFilteredView.unselectComment(commentView.commentView);
        // Select comment
        this._sortedFilteredView.graphView.setSelectedComment(commentView);
        // Swap view to graphView
        this.sortToGraph();
        // Close Sort/Filter menu
        this._isInSortedMode = false;
        $('#filterSortButton').removeClass('active');
        $('#sortFunctionsContainer').hide();
      }).bind(this));
    });

    // Activate or desactivate a sortFunction
    $('.sortIconNone').click((e) => {
      const sortFunctionDOM = $(e.currentTarget).closest('.sortFunction');
      const sortFunctionView = this._sortedFilteredView.allSortFunctionsView[sortFunctionDOM.attr('id')];

      sortFunctionView.sortFunctionModel.isActive = $(e.currentTarget).find('.sortIconIsNotActive').is(':visible');
      if((!sortFunctionView.sortFunctionModel.isActive) && sortFunctionView.isSelected()) {
        this._sortedFilteredView.unselectSortFunction(sortFunctionView);
      }
      sortFunctionView.render();
      // SortFunction activated or desactivated : it's changing all sort functions weights (mainSortFunction will be recalculated also)
      this.setSortFunctionsWeight();
    });
    // Change sort function direction
    $('.sortIconContainer').click((e) => {
      const sortFunctionDOM = $(e.currentTarget).closest('.sortFunction');
      const sortFunctionView = this._sortedFilteredView.allSortFunctionsView[sortFunctionDOM.attr('id')];

      if(sortFunctionView.sortFunctionModel.sortDirection == 'desc') {
        sortFunctionView.sortFunctionModel.setSortDirection('asc');
      }
      else {
        sortFunctionView.sortFunctionModel.setSortDirection('desc');
      }
      sortFunctionView.render();
      // SortFunction change sorting direction : we have to recalculate mainSortFunction
      this.mainSortFunctionClassify();
    });

    // Modify parameters of a sort function
    $('.sortParameters').click((e) => {
      const sortFunctionDOM = $(e.currentTarget).closest('.sortFunction');
      const sortFunctionView = this._sortedFilteredView.allSortFunctionsView[sortFunctionDOM.attr('id')];

      if(sortFunctionView.isSelected()) {
        // Parameters opened for this function : close it
        this._sortedFilteredView.unselectSortFunction(sortFunctionView);
        $('#sortFunctionParameters').addClass('hidden');
      }
      else {
        // Select sort function
        this._sortedFilteredView.selectSortFunction(sortFunctionView);
        if($('#sortFunctionParameters').hasClass('hidden')) {
          // Sort parameters is hidden : show it
          $('#sortFunctionParameters').removeClass('hidden');
        }
      }
    });

    // SortFunctionSlider update
    $('#sortFunctionSlider').mousedown((mousedownEvent) => {
      var currentSliderValue = Math.floor($(mousedownEvent.currentTarget).val());

      // Listen for mouse move, to update slide value
      $(document).mousemove(() => {
        var newSlideValue = Math.floor($(mousedownEvent.currentTarget).val());
        if(newSlideValue != currentSliderValue) {
          currentSliderValue = newSlideValue;
          this.updateSortFunctionSlider();
        }
      });

      $(document).mouseup(() => {
        // Stop listening
        $(document).off('mouseup');
        $(document).off('mousemove');
      });
    });
    $('#sortFunctionSlider').change(() => {
      this.updateSortFunctionSlider();
    });

    // Update on a MIN / MAX filter
    $('#sortFunctionDistributionBarChart').on('minimumFilterChange', (event) => {
      const currentSortFunction = this._sortedFilteredView.sortFunctionSelected.sortFunctionModel;
      const oldMinimumFilterIndex = currentSortFunction.minimumFilterIndex;
      currentSortFunction.minimumFilter = event.minimumFilter;
      currentSortFunction.setClassesColors();

      if(oldMinimumFilterIndex != currentSortFunction.minimumFilterIndex) {
        this.mainSortFunctionClassify();
      }
    });
    $('#sortFunctionDistributionBarChart').on('maximumFilterChange', (event) => {
      const currentSortFunction = this._sortedFilteredView.sortFunctionSelected.sortFunctionModel;
      const oldMaximumFilterIndex = currentSortFunction.maximumFilterIndex;
      currentSortFunction.maximumFilter = event.maximumFilter;
      currentSortFunction.setClassesColors();

      if(oldMaximumFilterIndex != currentSortFunction.maximumFilterIndex) {
        this.mainSortFunctionClassify();
      }
    });

    // Drag and Drop sortFunctions to change theire weight
    $('.sortIconContainer').mousedown((mousedownEvent) => {
      mousedownEvent.stopImmediatePropagation(); // Avoid dragging, when clicking on sortIcon
    });
    $('.sortIconNone').mousedown((mousedownEvent) => {
      mousedownEvent.stopImmediatePropagation(); // Avoid dragging, when clicking on sortIconNone
    });
    $('.sortParameters').mousedown((mousedownEvent) => {
      mousedownEvent.stopImmediatePropagation(); // Avoid dragging, when clicking on sortParameters
    });
    $('.sortFunction').mousedown((mousedownEvent) => {
      this.dragAndDropSortFunction(mousedownEvent);
    });

    // Init sortFunctions weights
    this.setSortFunctionsWeight();
    // Then "hide" sort containers as we start in Graph Mode
    this._sortedFilteredView.hideSortContainers();
    // Init filtered comments for barChart
    this._sortedFilteredView.barChart.setAllFilteredComments(this._sortedFilteredView.graphModel.mainSortFunction.filteredComments);

    return this;
  }

  updateSortFunctionSlider() {
    const currentSliderValue = Math.floor($('#sortFunctionSlider').val());
    this._sortedFilteredView.updateSortFunctionSlider(currentSliderValue);

    this._sortedFilteredView.sortFunctionSelected.sortFunctionModel.relativeDiffMax = (currentSliderValue / 100);

    var classChange = this._sortedFilteredView.sortFunctionSelected.sortFunctionModel.classify();
    if(classChange) {
      this._sortedFilteredView.sortFunctionSelected.renderParameters(this._sortedFilteredView.barChart);
      this.mainSortFunctionClassify();
    }
  }

  dragAndDropSortFunction(mousedownEvent) {
    const sortFunctionDOM = $(mousedownEvent.currentTarget);
    const sortFunctionView = this._sortedFilteredView.allSortFunctionsView[sortFunctionDOM.attr('id')];
    if(sortFunctionView.sortFunctionModel.isActive) {
      // Create the separator, to visualize the index changes on dragging
      sortFunctionDOM.after('<div id="sortFunctionSeparator" class="border-dashed border-l-2 border-gray-600 ml-1 self-stretched">&nbsp;</div>');

      // Get sort functions positions, to know where to change index
      var positions = [];
      var currentTargetIndex;
      _.each(this._sortedFilteredView.allSortFunctionsView, (currentSortFunctionView, index) => {
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
      });
    }
  }

  setSortFunctionsWeight() {
    var childs = $('#allSortFunctions').children('.active');
    for(var weight = childs.length - 1 ; weight >= 0 ; weight--) {
      var sortFilterFunctionDOM = childs[weight];
      $('#allSortFunctions').prepend(sortFilterFunctionDOM);
      const sortFunction = this._sortedFilteredView.graphModel.mainSortFunction.allSortFunctions[$(sortFilterFunctionDOM).attr('id')];
      sortFunction.weight = childs.length - weight;
    }

    // Weights change : sort again - TODO : only if real change
    this.mainSortFunctionClassify();
  }

  mainSortFunctionClassify() {
    this._sortedFilteredView.graphModel.mainSortFunction.classify();
    this._sortedFilteredView.barChart.setAllFilteredComments(this._sortedFilteredView.graphModel.mainSortFunction.filteredComments);
    if(this._sortedFilteredView.sortFunctionSelected) {
      this._sortedFilteredView.barChart.updateCommentsColors(this._sortedFilteredView.sortFunctionSelected.sortFunctionModel.classes);
    }
    this._sortedFilteredView.sortCommentsToContainers();
    this._sortedFilteredView.showSortContainers();
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

    _.each(this._sortedFilteredView.graphView.commentsView, (commentView) => {
      // Switch selectCommentButtons, making click right behaviour
      commentView.commentView.find('.selectCommentButton-sort').removeClass('hidden');
      commentView.commentView.find('.selectCommentButton-graph').addClass('hidden');

      // Over/Out a comment : "select" it
      commentView.commentView.mouseenter((function() {
        this._sortedFilteredView.selectComment(commentView.commentView);

        commentView.commentView.off('mouseleave');
        commentView.commentView.mouseleave((function() {
          this._sortedFilteredView.unselectComment(commentView.commentView);
        }).bind(this));
      }).bind(this));
    });

    // Update View
    this._sortedFilteredView.graphToSort();
  }

  sortToGraph() {
    // Update View (before animating again)
    this._sortedFilteredView.sortToGraph();

    _.each(this._sortedFilteredView.graphView.commentsView, (commentView) => {
      // Switch selectCommentButtons, making click right behaviour
      commentView.commentView.find('.selectCommentButton-graph').removeClass('hidden');
      commentView.commentView.find('.selectCommentButton-sort').addClass('hidden');

      // Remove Over/Out "selection"
      commentView.commentView.off('mouseenter');
      commentView.commentView.off('mouseleave');
    });

    // Force "reset" of selection, to re-build Graph
    const selectedComment = this._sortedFilteredView.graphView.selectedComment;
    this._sortedFilteredView.graphView.setSelectedComment(null);
    this._graphNavigator.selectComment(selectedComment);
    this._graphNavigator.selectCommentUpdateModel();

    // Add scroll and keyboard listeners again, for graph navigation
    this._graphNavigator.addListeners();

    // We can animate graph again
    animation_manager.animated = true;
  }


}

module.exports = new SortedFilteredController();
