/**
 * External libraries
 */
var _ = require('underscore');

/**
 * Project requirements
 */
var {
  COMMENT_DATE_DISPLAY
} = require('../parameters/parameters');

/**
 * Manage user events on Graph
 */
class GraphController {
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

  // --- Functions
  /**
   * Create the GraphController
   * @class
   * @returns {GraphController} this
   */
  constructor() {
    return this;
  }

  /**
    * Init the GraphController
    * @access public
    * @param {GraphModel} graphModel - The model of the graph
    * @param {GraphView} graphView - The view of the graph
    * @param {GraphNavigator} graphNavigator - The navigation controller of the graph
    * @returns {GraphController} this
    */
  init(graphModel, graphView, graphNavigator) {
    this._graphModel = graphModel;
    this._graphView = graphView;
    this._graphNavigator = graphNavigator;

    var self = this;
    _.each(this.graphView.commentsView, (comment, index, list) => {
      // Over showActionsContainer... show the actionsContainer
      comment.commentView.find('.showActionsContainer').on('mouseenter', (e) => {
        this.showActionsContainer(comment);
      });

      // Click on selectCommentButton... select the comment
      comment.commentView.find('.selectCommentButton-graph').click((() => {
        this._graphNavigator.selectCommentAndScroll(comment);
      }).bind(this));

    });

    // Click on a date : change date display mode to next display mode (modulo)
    $('.date').click(() => {
      const currentIndex = _.indexOf(COMMENT_DATE_DISPLAY.values, COMMENT_DATE_DISPLAY.currentValue);
      const nextIndex = (currentIndex + 1) % (COMMENT_DATE_DISPLAY.values.length);
      COMMENT_DATE_DISPLAY.currentValue = COMMENT_DATE_DISPLAY.values[nextIndex];
      _.each(this.graphView.commentsView, (comment) => {
        comment.formatDate();
      });
    });

    return this;
  }

  /**
    * Over showActionsContainer... show the actionsContainer
    * @access public
    * @param {CommentModel} comment - The comment to expend
    */
  showActionsContainer(comment) {
    comment.commentView.find('.showActionsContainer').off('mouseenter');
    comment.showActionsContainer.bind(comment)();
    // Set listener to hide the actionsContainer
    comment.commentView.on('mouseleave', (e) => {
      this.hideActionsContainer(comment);
    });
  }
  /**
    * Out of comment : hide the actionsContainer
    * @access public
    * @param {CommentModel} comment - The comment to expend
    */
  hideActionsContainer(comment) {
    comment.commentView.off('mouseleave');
    comment.hideActionsContainer.bind(comment)();
    // Set listener again to show the actionsContainer
    comment.commentView.find('.showActionsContainer').on('mouseenter', (e) => {
      this.showActionsContainer(comment);
    });
  }
}

module.exports = new GraphController();
