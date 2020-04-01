/**
 * External libraries
 */
const _ = require('underscore');

/**
 * Project requirements
 */
const comment_model = require("../models/commentModel");
const relation_model = require("../models/relationModel");
const main_sort_function = require("../models/sortFunctions/mainSortFunction");
const { Array2D } = require('../utils/array2D');

/**
 * Model of the comments graph
 */
class GraphModel {
  // --- Vars and accessors
  _grid; // Array2D<commentId> | sorted displayed comments (hollow matrix)
  get grid() {
    return this._grid;
  }
  set grid(val) {
    this._grid = val;
  }
  _relationsModel; // Object<RelationModel> | Key : the child comment Id. All the relations beetween comments
  get relationsModel() {
    return this._relationsModel;
  }
  _commentsModel; // Object<CommentModel> | Key : the comment Id. All the comments
  get commentsModel() {
    return this._commentsModel;
  }
  _rootComments; // Array<commentId> | All the comments with no parent
  get rootComments() {
    return this._rootComments;
  }
  set rootComments(val) {
    this._rootComments = val;
  }
  _mainSortFunction;
  get mainSortFunction() {
    return this._mainSortFunction;
  }

  // --- Functions
  /**
   * Create the GraphModel
   * @class
   * @returns {GraphModel} this
   */
  constructor() {
    this._grid = new Array2D();
    this._relationsModel = {};
    this._commentsModel = {};
    this._rootComments = [];

    return this;
  }

  /**
    * Init the GraphModel
    * @access public
    * @returns {GraphModel} this
    */
  init() {
    this.initComments();
    this.initRelations();
    this._mainSortFunction = main_sort_function;
    this._mainSortFunction.init(this);
    this.buildGrid((commentId) => {
      return (commentId != null) ? 0 : 1;
    });

    return this;
  }
  /**
    * Init the comments
    * @access private
    */
  initComments() {
    _.each(comments, (comment, index, list) => {
      // Construct comment model
      var newCommentModel = new comment_model.CommentModel()
        .init(comment);
      // Save it
      this._commentsModel[newCommentModel.id] = newCommentModel;
      if (newCommentModel.parentCommentId == -1) {
        this._rootComments.push(newCommentModel.id);
      }
    });

    // Recursively calculate the list of all children
    _.each(this._rootComments, (commentId) => {
      this.setAllChildren(this._commentsModel[commentId]);
    });
  }
  /**
    * Recursivly build the array of all children comments
    * @access private
    * @param {CommentModel} commentModel - The current comment
    * @returns {Array.<int>} all children ids
    */
  setAllChildren(commentModel) {
    var childChildren = [];
    _.each(commentModel.childrenCommentsId, (childId) => {
      childChildren = this.setAllChildren(this._commentsModel[childId]);
      commentModel.allChildren = commentModel.allChildren.concat(childChildren);
    });
    return commentModel.allChildren;
  }
  /**
    * Init all relations
    * @access private
    */
  initRelations() {
    _.each(comments, (comment, index, list) => {
      if (comment.parentCommentId != -1) {
        // Construct relation model
        var newRelation = new relation_model.RelationModel(comment.parentCommentId, comment.id)
          .init();
        // Save it
        this._relationsModel[comment.id] = newRelation;
      }
    });
  }

  /**
    * Build the grid (Array of Array) of sorted comments
    * @access private
    */
  buildGrid(sortFunction) {
    console.log('buildGrid');
    // Reset the grid
    this.grid = new Array2D();
    // Sort rootComments
    this.rootComments = _.sortBy(this.rootComments, sortFunction);
    // Build it
    this._buildGridRecursive(this.rootComments, 0, 0, sortFunction);
    // Trigger change
    $(document).trigger('updateGrig');

    console.log('buildGrid done', this.grid);
  }
  /**
    * Build grid recursively
    * @access private
    * @param {Array.<int>} parents - The current parents ids
    * @param {int} currentLine - The current line index
    * @param {int} currentColumn - The current column index
    * @param {SortFunction} [sortFunction] - The function that will sort comments by 'relevancy'
    * @returns {int} The current column index
    */
  _buildGridRecursive(parents, currentLine, currentColumn, sortFunction = null) {
    _.each(parents, (parentId, index, list) => {
      var parent = this.commentsModel[parentId];
      if (parent.visible) {
        // Add it to grid
        this.grid.set(currentLine, currentColumn, parent.id);

        // Do recursive for childs
        parent.childrenCommentsId = (sortFunction) ?
          _.sortBy(parent.childrenCommentsId, sortFunction) :
          parent.childrenCommentsId;
        currentColumn = this._buildGridRecursive(parent.childrenCommentsId, currentLine + 1, currentColumn + 1, sortFunction);

        // Childs done, do for brothers
      }
    });

    return currentColumn;
  }
  /**
    * Fold children of the comment and recursively fold & hide children
    * @access public
    * @param {CommentModel} commentToFold - The comment to fold
    */
  foldChildrenComments(commentToFold) {
    if (!commentToFold.isFolded) {
      commentToFold.fold();

      var nbChildrenHiden = 0;
      _.each(commentToFold.allChildren, (childId) => {
        const childComment = this.commentsModel[childId];
        if(childComment.visible) {
          this.hideComment(childComment);
          nbChildrenHiden++;
        }
      });

      this.grid.deleteColumns(this.grid.getCoordinates(commentToFold.id).columnIndex + 1, nbChildrenHiden);
    }
  }
  /**
    * Hide a comment
    * @access public
    * @param {CommentModel} commentToHide - The comment to hide
    */
  hideComment(commentToHide) {
    commentToHide.fold();
    commentToHide.hide();
  }
  /**
    * Unfold children of the comment
    * @access public
    * @param {CommentModel} commentToUnfold - The comment to unfold
    */
  unfoldChildrenComments(commentToUnfold) {
    if (commentToUnfold.isFolded && commentToUnfold.childrenCommentsId.length > 0) {
      commentToUnfold.unfold();
      const commentToUnfoldCoords = this.grid.getCoordinates(commentToUnfold.id);

      const gridHeight = Math.max(this.grid.height, commentToUnfoldCoords.rowIndex + 1);
      var newColumns = [];
      _.each(commentToUnfold.childrenCommentsId, (childrenId, index, list) => {
        this.commentsModel[childrenId].show();
        var newColumn = Array(gridHeight).fill(undefined);
        newColumn[commentToUnfoldCoords.rowIndex + 1] = childrenId;
        newColumns.push(newColumn);
      });

      this.grid.spliceColumns(commentToUnfoldCoords.columnIndex + 1, ...newColumns);
    }
  }

}

module.exports = new GraphModel();
