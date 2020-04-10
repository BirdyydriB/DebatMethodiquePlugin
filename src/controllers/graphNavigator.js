/**
 * External libraries
 */
var _ = require('underscore');
// var Array2D = require('array2d');

/**
 * Project requirements
 */
const { Array2D } = require('../utils/array2D');
const {
  ANIMATION_TIME
} = require('../parameters/constants');
const {
  GRAPH_DISPLAY_ORIENTATION
} = require('../parameters/parameters');
const animation_manager = require("../views/animationManager");

/**
 * Manage user navigation on Graph
 */
class GraphNavigator {
  // --- Vars and accessors
  _graphModel; // Singleton | The GraphModel
  get graphModel() {
    return this._graphModel;
  }
  _graphView; // Singleton | The GraphView
  get graphView() {
    return this._graphView;
  }
  _currentGridCoordinates; // {rowIndex:int, columnIndex:int} | Vertical x Horizontal coordinates of top-left comment
  get currentGridCoordinates() {
    return this._currentGridCoordinates;
  }
  _denseGrid; // Array2D<commentId> | graphModel grid (displayed comments) without undefined
  get denseGrid() {
    return this._denseGrid;
  }
  set denseGrid(val) {
    this._denseGrid = val;
  }
  _testStopScrollTimeout; // Timeout | to test if User has stopped scrolling
  get testStopScrollTimeout() {
    return this._testStopScrollTimeout;
  }
  set testStopScrollTimeout(val) {
    this._testStopScrollTimeout = val;
  }
  _currentScroll; // Object{top:,left:} | current $('#graphContainer').scrollXXX To get deltaScrollXXX
  get currentScroll() {
    return this._currentScroll;
  }
  set currentScroll(val) {
    this._currentScroll = val;
  }

  // --- Functions
  /**
   * Create the GraphNavigator
   * @class
   * @returns {GraphNavigator} this
   */
  constructor() {
    this._currentScroll = {top:0, left:0};
    this._currentGridCoordinates = {columnIndex:0, rowIndex:0};
    return this;
  }

  /**
    * Init the GraphNavigator
    * @access public
    * @param {GraphModel} graphModel - The model of the graph
    * @param {GraphView} graphView - The view of the graph
    * @returns {GraphNavigator} this
    */
  init(graphModel, graphView) {
    console.log('GraphNavigator init');
    this._graphModel = graphModel;
    this._graphView = graphView;
    this._graphView.updateGridCoordinates(this.currentGridCoordinates.columnIndex, this.currentGridCoordinates.rowIndex);

    // Listen to graphModel grid changes, to rebuild this.denseGrid
    $(document).on('updateGrig', this.buildDenseGrid.bind(this));

    // Listen to scroll && keyboard event
    this.addListeners();
    setInterval(this.updateGridCoordinatesFromScroll.bind(this), 20);

    this.buildDenseGrid();

    // Select 0x0 comment
    this.selectComment(this._graphView.commentsView[this._graphModel.rootComments[0]]);

    return this;
  }

  /**
    * Build this.denseGrid in case of graphModel.grid changes
    * @access public
    */
  buildDenseGrid() {
    this.denseGrid = new Array2D();

    this.graphModel.grid.eachRow((row, rowIndex) => {
      _.each(row, (commentId) => {
        if ((commentId != undefined)
          && (this._graphModel.commentsModel[commentId].visible)) {

          const columnIndex = this.denseGrid.row(rowIndex).length;
          this.denseGrid.set(rowIndex, columnIndex, commentId);
        }
      });
    });

    this.alignSelectedPath();

    if (GRAPH_DISPLAY_ORIENTATION.currentValue === 'VERTICAL') {
      // Reverse denseGrid for VERTICAL ORIENTATION, to make every functions works well regardless of the orientation
      this.denseGrid.reverse();
    }
  }

  /**
    * Update grid coordinates, looking selected comment (align selected path)
    * @access private
    */
  alignSelectedPath() {
    var nbEmptyAnchors = 0;
    // Which comment is currently the leftest/topest
    var maxPosition = 0;
    _.each(this.graphView.selectedPath, (commentId) => {
      var currentColumn = this.denseGrid.getCoordinates(commentId).columnIndex
      if(currentColumn > maxPosition) {
        maxPosition = currentColumn;
      }
    });

    // Align on this 'maxComment' coordinate
    for(var i = 0 ; i < this.graphView.selectedPath.length ; i++) {
      const currentRow = [...this.denseGrid.row(i)];
      const currentCoords = this.denseGrid.getCoordinates(this.graphView.selectedPath[i]);
      // How much should we translate to align with 'maxComment' coordinate ?
      const delta = maxPosition - currentCoords.columnIndex;
      if(delta != 0) {
        // Create delta "empty" objects, to make scroll anchors
        for(var emptyCoord = 0 ; emptyCoord < delta ; emptyCoord++) {
          nbEmptyAnchors++;
          this.denseGrid.unshift(i, -1 * nbEmptyAnchors);
        }
      }
    }

    // For lines below the selectedPath, align first with parent
    for(var i = Math.max(1, this.graphView.selectedPath.length) ; i < this.denseGrid.height ; i++) {
      const currentRow = this.denseGrid.row(i);
      const currentId = currentRow[0];
      const parentId = this.graphModel.commentsModel[currentId].parentCommentId;
      const currentCoords = this.denseGrid.getCoordinates(currentId);
      const parentCoords = this.denseGrid.getCoordinates(parentId);

      const delta = parentCoords.columnIndex - currentCoords.columnIndex;
      if(delta != 0) {
        // Create delta "empty" objects, to make scroll anchors
        for(var emptyCoord = 0 ; emptyCoord < delta ; emptyCoord++) {
          nbEmptyAnchors++;
          this.denseGrid.unshift(i, -1 * nbEmptyAnchors);
        }
      }
    }
  }

  /**
    * Add scroll and keyboard listeners, to manage graph navigation
    * @access public
    */
  addListeners() {
    $('#graphContainer').on('scroll', this.onScroll.bind(this));
    $(document).keydown(this.onKeypress.bind(this));
  }

  /**
    * Remove scroll and keyboard listeners, avoiding graph navigation when not needed
    * @access public
    */
  removeListeners() {
    $('#graphContainer').off('scroll');
    $(document).off('keydown');
    if (this.testStopSelectingTimeout) {
      clearTimeout(this.testStopSelectingTimeout);
    }
  }

  /**
    * Scroll main view to topLeft comment
    * @access public
    * @param {DenseGridObject} topLeft - The top left comment in viewport
    * @param {Boolean} constantSpeed - True if scroll is made with constant speed
    */
  scrollMainContainer(topLeft, constantSpeed) {
    $('#graphContainer').off('scroll');
    // Scroll to nearest comment and get in return time needed
    const scrollTime = animation_manager.scrollMain($('#graphContainer'), {
      scrollTop: this.mapCommentsPosition(topLeft, 'top'),
      scrollLeft: this.mapCommentsPosition(topLeft, 'left')
    }, constantSpeed);
    // Add scroll listener again, few times after sroll to nearest ended
    setTimeout(() => {
      $('#graphContainer').on('scroll', this.onScroll.bind(this));
    }, scrollTime * 1.1);
  }
  /**
    * Scroll View to selected comment -1, -1
    * @access public
    * @param {Boolean} constantSpeed - True if scroll is made with constant speed
    */
  scrollMainContainerToSelected(constantSpeed) {
    const selectedIndexes = this.denseGrid.getCoordinates(this.graphView.selectedComment.commentModel.id);
    const previousBrother = this.denseGrid.get(Math.max(0, selectedIndexes.rowIndex - 1), Math.max(0, selectedIndexes.columnIndex - 1));
    this.scrollMainContainer(previousBrother, constantSpeed);
  }

  /**
    * Basic onScroll event, to test scrolling stop
    * @access private
    * @param {Event} event - scroll event
    */
  onScroll(event) {
    if (this.testStopScrollTimeout) {
      // Reset timeout
      clearTimeout(this.testStopScrollTimeout);
    }
    // Try to launch onScrollStop before reset ?
    this.testStopScrollTimeout = setTimeout(this.onScrollStop.bind(this), 300);
  }
  /**
    * testStopScrollTimeout wasn't reset, onScrollStop succeed launching : user has stopped scrolling
    * @access private
    */
  onScrollStop() {
    this.updateGridCoordinatesFromScroll();
    if ($('#graphContainer')[0].scrollTop != $('#graphContainer')[0].scrollTopMax &&
      $('#graphContainer')[0].scrollLeft != $('#graphContainer')[0].scrollLeftMax) {
      var newTopLeft = this.denseGrid.get(this.currentGridCoordinates.rowIndex, this.currentGridCoordinates.columnIndex);
      this.scrollMainContainer(newTopLeft, true);
    }
  }

  mapCommentsPosition(commentId, direction) {
    if(parseInt(commentId) > 0) {
      // 'this' is a comment : return position defined by direction
      return this.graphView.commentsView[commentId].commentView[direction];
    }
    else {
      // 'this' is an 'empty' comment, to get a scroll anchor. Look top/left position of first comment of the same row/column.
      const coords = this.denseGrid.getCoordinates(commentId);
      const dimension = (direction == 'top') ?
        this.denseGrid.row(coords.rowIndex) :
        this.denseGrid.column(coords.columnIndex);
      for(var i = 0 ; i < dimension.length ; i++) {
        if(parseInt(dimension[i]) > 0) {
          return this.mapCommentsPosition(dimension[i], direction);
        }
      }
      return 0;
    }
  }
  /**
    * From $('#graphContainer').scrollTop and scrollLeft, find nearest DOM comment
    * @access private
    */
  updateGridCoordinatesFromScroll() {
    const delta = {
      top: $('#graphContainer').scrollTop() - this.currentScroll.top,
      left: $('#graphContainer').scrollLeft() - this.currentScroll.left
    };
    this.currentScroll.top = $('#graphContainer').scrollTop();
    this.currentScroll.left = $('#graphContainer').scrollLeft();

    var directions = ['top', 'left'];
    for(var direction of directions) {
      const currentDimension = (direction == 'top') ?
        this.denseGrid.column(this.currentGridCoordinates.columnIndex) :
        this.denseGrid.row(this.currentGridCoordinates.rowIndex);

      const dimensionPositions = _.map(currentDimension, (elem) => {
        if(elem != undefined) {
          return this.mapCommentsPosition(elem, direction);
        }
      });

      if(delta[direction] != 0) {
        const currentIndex = _.sortedIndex(dimensionPositions, this.currentScroll[direction]);
        const previousIndex = Math.max(0, currentIndex - 1);
        const nextIndex = Math.min(currentDimension.length - 1, currentIndex);
        if (this.currentScroll[direction] < dimensionPositions[previousIndex] + ((dimensionPositions[nextIndex] - dimensionPositions[previousIndex]) / 2)) {
          this.updateGridCoordinatesFromNearest(this.denseGrid.getCoordinates(currentDimension[previousIndex]));
        }
        else {
          this.updateGridCoordinatesFromNearest(this.denseGrid.getCoordinates(currentDimension[nextIndex]));
        }
      }
    }
  }
  /**
    * Update currentGridCoordinates from top-left comment lineIndex and columnIndex
    * @access private
    * @param {Object} nearestComment - the coordinates of the comment closest to the current scroll position
    * @param {int} nearestComment.rowIndex - the rowIndex of the comment
    * @param {int} nearestComment.columnIndex - the columnIndex of the comment
    */
  updateGridCoordinatesFromNearest(nearestComment) {
    if ((nearestComment.rowIndex != this.currentGridCoordinates.rowIndex) ||
      (nearestComment.columnIndex != this.currentGridCoordinates.columnIndex)) {
      this.currentGridCoordinates.rowIndex = nearestComment.rowIndex;
      this.currentGridCoordinates.columnIndex = nearestComment.columnIndex;
      this.graphView.updateGridCoordinates(this.currentGridCoordinates.columnIndex, this.currentGridCoordinates.rowIndex);
    }
  }

  /**
    * Select a comment (only one could be selected)
    * @access public
    * @param {CommentView} commentToSelect - the comment to select
    */
  selectComment(commentToSelect, isAnimated = true) {
    if (!this.graphView.selectedComment || (this.graphView.selectedComment.commentModel.id != commentToSelect.commentModel.id)) {
      // Unselect the previous one
      if (this.graphView.selectedComment) {
        this.graphView.selectedComment.unselect();
        _.each(this.graphView.selectedComment.commentModel.allChildren, (commentId) => {
          this.graphView.commentsView[commentId].unselectAsChild();
        });
        _.each(this.graphView.selectedComment.commentModel.allParents, (commentId) => {
          this.graphView.commentsView[commentId].unselectAsParent();
        });
      }

      this.graphView.selectedComment = commentToSelect;
      commentToSelect.select(this.graphView.depthColors[0]);
      const selectedRow = commentToSelect.commentModel.allParents.length;

      // Select ancestors
      _.each(commentToSelect.commentModel.allParents, (parentId) => {
        const parentView = this.graphView.commentsView[parentId];
        const parentDepth = Math.abs(selectedRow - parentView.commentModel.allParents.length);
        parentView.selectAsParent(parentDepth, this.graphView.depthColors[parentDepth]);
      });
      // Select descendants
      _.each(commentToSelect.commentModel.allChildren, (childId) => {
        const childView = this.graphView.commentsView[childId];
        const childDepth = Math.abs(selectedRow - childView.commentModel.allParents.length);
        childView.selectAsChild(childDepth, this.graphView.depthColors[childDepth]);
      });

      if(isAnimated) {
        // Scroll View to selected comment -1, -1
        this.scrollMainContainerToSelected(false);

        // Do model change and resize, only if user has stopped selecting
        if (this.testStopSelectingTimeout) {
          clearTimeout(this.testStopSelectingTimeout);
        }
        // Try to launch selectCommentUpdateModel before reset ?
        this.testStopSelectingTimeout = setTimeout(this.selectCommentUpdateModel.bind(this), 400);
      }
    }
  }
  /**
    * Select a comment (only one could be selected). Resource-intensive function, therefore only starts up after we are "sure" user has stopped selecting.
    * @access public
    * @param {CommentView} commentToSelect - the comment to select
    */
  selectCommentUpdateModel() {
    // Select new
    _.each(this.graphModel.commentsModel, (commentModel) => {
      const isSelectedChild = (_.indexOf(this.graphView.selectedComment.commentModel.allChildren, commentModel.id) != -1);
      const isSelectedParent = (_.indexOf(this.graphView.selectedComment.commentModel.allParents, commentModel.id) != -1);
      const isSelected = (this.graphView.selectedComment.commentModel.id == commentModel.id);
      const isBrother = (this.graphView.selectedComment.commentModel.parentCommentId == commentModel.parentCommentId);

      if (isSelected && !this.graphView.selectedComment.isExpanded) {
        this.graphView.selectedComment.resize();
      }
      if (!isSelected && this.graphView.commentsView[commentModel.id].isExpanded) {
        // Old selected => return to default size
        this.graphView.commentsView[commentModel.id].resize();
      }

      if (isSelected || isSelectedChild || isSelectedParent || isBrother) {
        // Unfold everything
        this.graphModel.unfoldChildrenComments(commentModel);
      } else {
        // Comment not related to selected comment, fold it
        this.graphModel.foldChildrenComments(commentModel);
      }
    });

    // Rebuild denseGrid
    this.buildDenseGrid();

    // And refresh view
    this.graphView.refresh();

    // Scroll View to selected comment -1, -1
    this.scrollMainContainerToSelected(false);
  }

  /**
    * Keyboard event listener, to move selection
    * @access public
    * @param {Event} event - keyboard event
    */
  onKeypress(event) {
    // Prevent default behaviour
    event.preventDefault();

    switch (event.keyCode) {
      case 38: //UP
        if (GRAPH_DISPLAY_ORIENTATION.currentValue == 'HORIZONTAL') {
          this.selectParent();
        } else {
          this.selectPreviousBrother();
        }
        break;
      case 40: //DOWN
        if (GRAPH_DISPLAY_ORIENTATION.currentValue == 'HORIZONTAL') {
          this.selectFirstChild();
        } else {
          this.selectNextBrother();
        }
        break;
      case 37: //LEFT
        if (GRAPH_DISPLAY_ORIENTATION.currentValue == 'HORIZONTAL') {
          this.selectPreviousBrother();
        } else {
          this.selectParent();
        }
        break;
      case 39: //RIGHT
        if (GRAPH_DISPLAY_ORIENTATION.currentValue == 'HORIZONTAL') {
          this.selectNextBrother();
        } else {
          this.selectFirstChild();
        }
        break;
      default:
    }
  }
  /**
    * Select the parent of the currently selected comment
    * @access private
    */
  selectParent() {
    const parentId = this.graphView.selectedComment.commentModel.parentCommentId;
    if (parentId != -1) {
      this.selectComment(this.graphView.commentsView[parentId]);
    }
  }
  /**
    * Select the first child of the currently selected comment
    * @access private
    */
  selectFirstChild() {
    if (this.graphView.selectedComment.commentModel.childrenCommentsId.length > 0) {
      const firstChildId = this.graphView.selectedComment.commentModel.childrenCommentsId[0];
      this.selectComment(this.graphView.commentsView[firstChildId]);
    }
  }
  /**
    * Select the previous brother in parent children list, of the currently selected comment
    * @access private
    */
  selectPreviousBrother() {
    const parentId = this.graphView.selectedComment.commentModel.parentCommentId;
    const brothers = (parentId == -1)
      ? this.graphModel.rootComments
      : this.graphModel.commentsModel[parentId].childrenCommentsId;
    const currentIndex = _.indexOf(brothers, this.graphView.selectedComment.commentModel.id);
    if (currentIndex > 0) {
      this.selectComment(this.graphView.commentsView[brothers[currentIndex - 1]]);
    }
  }
  /**
    * Select the next brother in parent children list, of the currently selected comment
    * @access private
    */
  selectNextBrother() {
    const parentId = this.graphView.selectedComment.commentModel.parentCommentId;
    const brothers = (parentId == -1)
      ? this.graphModel.rootComments
      : this.graphModel.commentsModel[parentId].childrenCommentsId;
    const currentIndex = _.indexOf(brothers, this.graphView.selectedComment.commentModel.id);
    if (currentIndex < brothers.length - 1) {
      this.selectComment(this.graphView.commentsView[brothers[currentIndex + 1]]);
    }
  }
}

module.exports = new GraphNavigator();
