/**
 * External libraries
 */
const _ = require('underscore');
const d3 = require('d3-shape');
const d3s = require('d3-selection');

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
const template_graph = require("../templates/graph");
const relation_view = require("../views/relationView");
const comment_view = require("../views/commentView");
const sortFunction_view = require("../views/sortFunctionView");
const animation_manager = require("../views/animationManager");
const colors = require("../utils/colors");
const { Array2D } = require('../utils/array2D');

/**
 * View of the comments graph
 */
class GraphView {
  // --- Vars and accessors
  _graphModel; // Singleton | The GraphModel
  get graphModel() {
    return this._graphModel;
  }
  _commentsView; // Object<CommentView> | Key : the comment Id. All the comments
  get commentsView() {
    return this._commentsView;
  }
  _relationsView; // Object<RelationView> | Key : the child comment Id. All the relations beetween comments
  get relationsView() {
    return this._relationsView;
  }
  _d3RelactionContainer; // d3 | Container of all relations views
  get d3RelactionContainer() {
    return this._d3RelactionContainer;
  }
  _selectedComment; // CommentView | The current selected comment view. Only one comment is selected and there is always one selected
  get selectedComment() {
    return this._selectedComment;
  }
  setSelectedComment(comment) {
    const rslt = (this._selectedComment = comment);
    if(comment != null) {
      this._selectedPath = _.clone(comment.commentModel.allParents);
      this._selectedPath.push(comment.commentModel.id);
      var children = comment.commentModel.childrenCommentsId;
      while(children.length > 0) {
        this._selectedPath.push(children[0]);
        children = this.graphModel.commentsModel[children[0]].childrenCommentsId;
      }
    }
    return rslt;
  }
  _selectedPath;
  get selectedPath() {
    return this._selectedPath;
  }
  _depthColors; // Array<colors> | Key : relative depth of comment (compare to selected). Value the color (string).
  get depthColors() {
    return this._depthColors;
  }
  _allSortFunctionsView;
  get allSortFunctionsView() {
    return this._allSortFunctionsView;
  }

  // --- Functions
  /**
   * Create the GraphView
   * @class
   * @returns {GraphView} this
   */
  constructor() {
    console.log('new GraphView');
    this._relationsView = {};
    this._commentsView = {};
    this._selectedPath = [];
    this._depthColors = [];
    this._allSortFunctionsView = {};
    return this;
  }

  /**
    * Init the GraphView
    * @access public
    * @param {GraphModel} graphModel - The model of this view
    * @returns {GraphView} this
    */
  init(graphModel) {
    console.log('GraphView init');
    this._graphModel = graphModel;

    $('#graphContainer').prepend(_.template(template_graph, {}));

    this._d3RelactionContainer = d3s.select('#relationsContainer')
      .append('svg:svg');

    // Create sort function views
    _.each(this._graphModel.mainSortFunction.allSortFunctions, (sortFunctionModel) => {
      const sortFunctionView = new sortFunction_view.SortFunctionView(sortFunctionModel);
      this._allSortFunctionsView[sortFunctionModel.id] = sortFunctionView;
    });

    // Create commentsView
    _.each(this.graphModel.commentsModel, (comment, index) => {
      var newCommentView = new comment_view.CommentView()
        .init(comment, $('#commentsContainer'), this._allSortFunctionsView);

      this.commentsView[index] = newCommentView;
    });

    // Create relations gradients (needed on selection)
    this.initGradientDepth();

    // Create relationsView
    _.each(this.graphModel.relationsModel, (relation, index) => {
      var relationView = new relation_view.RelationView()
        .init(relation, this._d3RelactionContainer);

      this.relationsView[index] = relationView;

      // Save relation into child and parent commentView
      this.commentsView[relation.child.id].parentRelationView = relationView;
      this.commentsView[relation.parent.id].childRelationsView.push(relationView);
    });

    // Display sortFunctions colors (if isActive)
    _.each(this._graphModel.mainSortFunction.allSortFunctions, (sortFunctionModel) => {
      if(sortFunctionModel.isActive) {
        this._allSortFunctionsView[sortFunctionModel.id].showAll();
      }
    });

    // Listen to model changes
    $(document).on('hideComment', (event, comment) => {
      this.hideComment(this.commentsView[comment.id]);
    });
    $(document).on('showComment', (event, comment) => {
      this.showComment(this.commentsView[comment.id]);
    });
    $(document).on('updateGrig', (event) => {
      this.refresh();
    });

    return this;
  }

  /**
    * Add gradient defs to DOM and depthColors to this, for selected comments and relations
    * @access private
    */
  initGradientDepth() {
    const defs = this._d3RelactionContainer.append('defs:defs');
    var firstColor = GOOD_COLOR;
    this.depthColors[0] = GOOD_COLOR;
    // Calculate all possible depth and gradient, thanks this, on comment selection we only have to pick up this precalculated values
    for(var depth = this.graphModel.grid.height - 1 ; depth > 0 ; depth--) {
      var relativeDepth = Math.abs((this.graphModel.grid.height - depth) / (this.graphModel.grid.height - 1));
      var secondColor = colors.getGradientColor(GOOD_COLOR, MIDDLE_COLOR, BAD_COLOR, relativeDepth);
      this.depthColors[(this.graphModel.grid.height - depth)] = secondColor;
      // "Normal" gradient
      var gradient = defs.append('linearGradient:linearGradient')
        .attr('id', 'relationGradient-' + (this.graphModel.grid.height - depth))
      gradient.append('stop:stop')
        .attr('offset', '0%')
        .attr('stop-color', firstColor);
      gradient.append('stop:stop')
        .attr('offset', '100%')
        .attr('stop-color', secondColor);
      // Same gradient but reversed colors
      var gradientReversed = defs.append('linearGradient:linearGradient')
        .attr('id', 'relationGradient-' + (this.graphModel.grid.height - depth) + '-r')
      gradientReversed.append('stop:stop')
        .attr('offset', '0%')
        .attr('stop-color', secondColor);
      gradientReversed.append('stop:stop')
        .attr('offset', '100%')
        .attr('stop-color', firstColor);
      // If child comment and parent comment are perfectly vertical aligned
      var gradientVertical = defs.append('linearGradient:linearGradient')
        .attr('id', 'relationGradient-' + (this.graphModel.grid.height - depth) + '-v')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', 1)
      gradientVertical.append('stop:stop')
        .attr('offset', '0%')
        .attr('stop-color', firstColor);
      gradientVertical.append('stop:stop')
        .attr('offset', '100%')
        .attr('stop-color', secondColor);
      // Same gradient but reversed colors
      var gradientVerticalReversed = defs.append('linearGradient:linearGradient')
        .attr('id', 'relationGradient-' + (this.graphModel.grid.height - depth) + '-v-r')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', 1)
      gradientVerticalReversed.append('stop:stop')
        .attr('offset', '0%')
        .attr('stop-color', secondColor);
      gradientVerticalReversed.append('stop:stop')
        .attr('offset', '100%')
        .attr('stop-color', firstColor);
      // If child comment and parent comment are perfectly horizontal aligned
      var gradientHorizontal = defs.append('linearGradient:linearGradient')
        .attr('id', 'relationGradient-' + (this.graphModel.grid.height - depth) + '-h')
      gradientHorizontal.append('stop:stop')
        .attr('offset', '0%')
        .attr('stop-color', firstColor);
      gradientHorizontal.append('stop:stop')
        .attr('offset', '100%')
        .attr('stop-color', secondColor);
      // Same gradient but reversed colors
      var gradientHorizontalReversed = defs.append('linearGradient:linearGradient')
        .attr('id', 'relationGradient-' + (this.graphModel.grid.height - depth) + '-h-r')
      gradientHorizontalReversed.append('stop:stop')
        .attr('offset', '0%')
        .attr('stop-color', secondColor);
      gradientHorizontalReversed.append('stop:stop')
        .attr('offset', '100%')
        .attr('stop-color', firstColor);

      firstColor = secondColor;
    }
  }

  /**
    * Remove the GraphView
    * @access public
    */
  remove() {
    console.log('GraphView remove');
    if ($('#graphContainer').length > 0) {
      $('#graphContainer').remove();
    }
  }

  /**
    * Update visibles comments positions, looking graphModel.grid
    * @access public
    */
  refresh() {
    // Reset selectedComment as childs could have been re-ordered differently
    this.setSelectedComment(this._selectedComment);
    var currentPositionOne = 0, currentPositionTwo = 0;

    for (var lineIndex = 0; lineIndex < this.graphModel.grid.height; lineIndex++) {
      var maxLineSize = 0;

      for (var columnIndex = 0; columnIndex < this.graphModel.grid.width; columnIndex++) {
        const commentId = this.graphModel.grid.get(lineIndex, columnIndex);

        if (commentId != null) {
          const commentView = this.commentsView[commentId];
          const commentDatas = ((orientation) => {
            switch (orientation) {
              case 'HORIZONTAL':
                return {
                  left: currentPositionTwo,
                  top: currentPositionOne,
                  sizeOne: commentView.width,
                  sizeTwo: commentView.height
                };
                break;
              case 'VERTICAL':
                return {
                  left: currentPositionOne,
                  top: currentPositionTwo,
                  sizeOne: commentView.height,
                  sizeTwo: commentView.width
                };
                break;
              default:
                return {};
            }
          })(GRAPH_DISPLAY_ORIENTATION.currentValue);

          // Set wanted position
          commentView.commentView.left = commentDatas.left;
          commentView.commentView.top = commentDatas.top;
          animation_manager.animate(commentView, commentView.commentView, {
            left: commentView.commentView.left,
            top: commentView.commentView.top
          });

          // Update for next comments
          currentPositionTwo += commentDatas.sizeOne + 2 * COMMENT_MARGIN_VERTICAL;

          if (commentDatas.sizeTwo > maxLineSize) {
            maxLineSize = commentDatas.sizeTwo;
          }
        }
      }

      currentPositionOne += maxLineSize + 2 * COMMENT_MARGIN_HORIZONTAL;
      currentPositionTwo = 0;
    }

    this.alignSelectedPath();

    return this;
  }

  /**
    * Update positions, looking selected comment (align selected path)
    * Update d3RelactionContainer size, looking the rightest and/or lowest comment
    * @access private
    */
  alignSelectedPath() {
    // Which comment of the selected path is currently the leftest/topest
    var maxCommentId = _.max(this.selectedPath, (commentId) => {
      return (GRAPH_DISPLAY_ORIENTATION.currentValue === 'HORIZONTAL')
        ? this.commentsView[commentId].commentView.left
        : this.commentsView[commentId].commentView.top;
    });

    var maxLeft = 0, maxTop = 0;
    // Align on this 'maxComment' position
    for(var i = 0 ; i < this.selectedPath.length ; i++) {
      const currentRow = [...this.graphModel.grid.row(i)];
      const currentCommentView = this.commentsView[this.selectedPath[i]].commentView;
      // How much should we translate to align with 'maxComment' position ?
      const delta = (GRAPH_DISPLAY_ORIENTATION.currentValue === 'HORIZONTAL')
        ? this.commentsView[maxCommentId].commentView.left - currentCommentView.left
        : this.commentsView[maxCommentId].commentView.top - currentCommentView.top;

      if(delta != 0) {
        // Translation of all comments of this row
        _.each(currentRow, (commentId) => {
          if(commentId != undefined) {
            const commentView = this.commentsView[commentId];
            switch (GRAPH_DISPLAY_ORIENTATION.currentValue) {
              case 'VERTICAL':
                commentView.commentView.top += delta;
                break;
              case 'HORIZONTAL':
                commentView.commentView.left += delta;
                break;
              default:
            }

            animation_manager.animate(commentView, commentView.commentView, {
              left: commentView.commentView.left,
              top: commentView.commentView.top
            });
          }
        });
      }

      // Is the last in row, the rightest and/or lowest comment ?
      const lastIndex = _.findLastIndex(currentRow, (cell) => (cell != undefined));
      const lastInRow = this.commentsView[currentRow[lastIndex]];
      if(lastInRow.commentView.top + lastInRow.height > maxTop) {
        maxTop = lastInRow.commentView.top + lastInRow.height;
      }
      if(lastInRow.commentView.left + lastInRow.width > maxLeft) {
        maxLeft = lastInRow.commentView.left + lastInRow.width;
      }
    }

    // For lines below the selectedPath, align first with parent
    for(var i = this.selectedPath.length ; i < this.graphModel.grid.height ; i++) {
      const currentRow = this.graphModel.grid.row(i);
      const currentId = currentRow[_.findIndex(currentRow, (cell) => (cell != undefined))];
      const parentId = this.graphModel.commentsModel[currentId].parentCommentId;

      const delta = (GRAPH_DISPLAY_ORIENTATION.currentValue === 'HORIZONTAL')
        ? this.commentsView[parentId].commentView.left - this.commentsView[currentId].commentView.left
        : this.commentsView[parentId].commentView.top - this.commentsView[currentId].commentView.top;

      if(delta != 0) {
        _.each(currentRow, (commentId) => {
          if(commentId != undefined) {
            switch (GRAPH_DISPLAY_ORIENTATION.currentValue) {
              case 'VERTICAL':
                this.commentsView[commentId].commentView.top += delta;
                break;
              case 'HORIZONTAL':
                this.commentsView[commentId].commentView.left += delta;
                break;
              default:
            }

            animation_manager.animate(this.commentsView[commentId], this.commentsView[commentId].commentView, {
              left: this.commentsView[commentId].commentView.left,
              top: this.commentsView[commentId].commentView.top
            });
          }
        });
      }

      // Is the last in row, the rightest and/or lowest comment ?
      const lastIndex = _.findLastIndex(currentRow, (cell) => (cell != undefined));
      const lastInRow = this.commentsView[currentRow[lastIndex]];
      if(lastInRow.commentView.top + lastInRow.height > maxTop) {
        maxTop = lastInRow.commentView.top + lastInRow.height;
      }
      if(lastInRow.commentView.left + lastInRow.width > maxLeft) {
        maxLeft = lastInRow.commentView.left + lastInRow.width;
      }
    }

    // Update d3RelactionContainer size, to draw all relations
    this.d3RelactionContainer.attr('height', maxTop).attr('width', maxLeft);
  }

  /**
    * Show a comment
    * @access public
    * @param {CommentView} commentToShow - The comment to show
    */
  showComment(commentToShow) {
    if (commentToShow.commentModel.visible) {
      const commentParent = this.commentsView[commentToShow.commentModel.parentCommentId];
      commentToShow.show({
        left: commentParent.commentView.left,
        top: commentParent.commentView.top
      });
      this.relationsView[commentToShow.commentModel.id].add();
    }
  }

  /**
    * Hide a comment
    * @access public
    * @param {CommentView} commentToHide - The comment to hide
    */
  hideComment(commentToHide) {
    if (!commentToHide.commentModel.visible) {
      const commentParent = this.commentsView[commentToHide.commentModel.parentCommentId];
      commentToHide.hide({
        left: commentParent.commentView.left,
        top: commentParent.commentView.top
      });
      commentToHide.commentView.left = commentParent.commentView.left;
      commentToHide.commentView.top = commentParent.commentView.top;
      this.relationsView[commentToHide.commentModel.id].remove();

      // If selected, unselect
      const selectedIndex = _.indexOf(this._selectedPath, commentToHide.commentModel.id);
      if (selectedIndex != -1) {
        this._selectedPath.splice(selectedIndex, 1);
      }
    }
  }

  /**
    * Update the top-left grid coordinate
    * @access public
    * @param {int} columnIndex - The column index of the top-left comment
    * @param {int} lineIndex - The line index of the top-left comment
    */
  updateGridCoordinates(columnIndex, lineIndex) {
    $('#graphCoordinates').html(columnIndex + 'x' + lineIndex);
  }

}

module.exports = new GraphView();
