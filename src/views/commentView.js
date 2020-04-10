/**
 * External libraries
 */
const _ = require('underscore');
const moment = require('moment');
require('moment-precise-range-plugin');

/**
 * Project requirements
 */
const {
  COMMENT_DEFAULT_WIDTH,
  COMMENT_EXPANDED_WIDTH,
  COMMENT_DEFAULT_MAX_HEIGHT,
  COMMENT_EXPANDED_MAX_HEIGHT
} = require('../parameters/constants');
const {
  COMMENT_DATE_DISPLAY
} = require('../parameters/parameters');
const template_comment = require("../templates/comment");
const animation_manager = require("../views/animationManager");
const momentUtilities = require('../utils/moment-utilities');
const colors = require("../utils/colors");
const localize = require('../parameters/localization/localize');

/**
 * HTML template of a comment view
 * @access private
 */
const commentTemplate = _.template(template_comment);

/**
 * The view of a comment
 */
class CommentView {
  // --- Vars and accessors
  _commentModel; // CommentModel | The model of this view
  get commentModel() {
    return this._commentModel;
  }
  _commentView; // $(DOM) | The comment in DOM
  get commentView() {
    return this._commentView;
  }
  _childRelationsView; // Array<RelationView> | The relations with the children of this comment
  get childRelationsView() {
    return this._childRelationsView;
  }
  set childRelationsView(val) {
    this._childRelationsView = val;
  }
  _parentRelationView; // RelationView | The relation with the parent of this comment
  get parentRelationView() {
    return this._parentRelationView;
  }
  set parentRelationView(val) {
    this._parentRelationView = val;
  }

  get visible() {
    return this.commentView.css('display') !== 'none';
  }
  _selected; // Boolean | Is this comment selected ?
  get selected() {
    return this._selected;
  }
  set selected(val) {
    return this._selected = val;
  }
  _selectedAsChild; // Boolean | Is this comment selected as child ?
  get selectedAsChild() {
    return this._selectedAsChild;
  }
  _selectedAsParent; // Boolean | Is this comment selected as parent ?
  get selectedAsParent() {
    return this._selectedAsParent;
  }

  get height() {
    return this._isExpanded ?
      this._expandedHeight :
      this._defaultHeight /*+ (this._actionsContainerVisible ?
        this._actionsContainerHeight :
        0)*/;
  }
  get width() {
    return this._isExpanded ?
      this._expandedWidth :
      this._defaultWidth;
  }
  _isExpanded;
  get isExpanded() {
    return this._isExpanded;
  }

  _defaultHeight; // int | Default height of this comment
  _expandedHeight; // int | Height of this comment when expanded
  _defaultWidth; // int | Default width of this comment
  _expandedWidth; // int | Width of this comment when expanded
  _actionsContainerVisible; // Boolean | true if actionsContainer is visible
  _actionsContainerHeight; // int | Height of actionsContainer

  // --- Functions
  /**
   * Create a CommentView
   * @class
   * @returns {CommentView} this
   */
  constructor() {
    this._childRelationsView = [];
    this._selected = false;
    this._selectedAsChild = false;
    this._selectedAsParent = false;
    this._isExpanded = false;
    return this;
  }

  /**
    * Init the CommentView
    * @access public
    * @param {CommentModel} commentModel - The model of this view
    * @param {object} commentContainer - The DOM container where the comment is drawn
    * @param {object} allSortFunctions - Sort functions views
    * @returns {CommentView} this
    */
  init(commentModel, commentContainer, allSortFunctions) {
    this._commentModel = commentModel;

    commentContainer.append(commentTemplate({
      id: 'comment-' + commentModel.id,
      content: commentModel.content,
      iconSrc: commentModel.author.iconSrc,
      author: commentModel.author.name,
      upVote: commentModel.upVote,
      nbChildren: commentModel.childrenCommentsId.length,
      nbChildrenTotal: commentModel.allChildren.length
    }));

    this._commentView = $('#comment-' + commentModel.id);

    // Open links in a new tab
    this.commentView.find('a').attr('target','_blank');

    this.formatDate();

    // Set bg-color/text-color for nbChildren, nbChildrenTotal and upVote
    const nbChildrenDOM = this.commentView.find('.commentFooter>.infosContainer>.answersContainer>.iconContainer');
    allSortFunctions.sortByNbChilds.add(this._commentModel.id, nbChildrenDOM);

    const allAnswersContainerDOM = this.commentView.find('.commentFooter>.infosContainer>.allAnswersContainer');
    const nbChildrenTotalDOM = allAnswersContainerDOM.find('.iconContainer');
    allSortFunctions.sortByNbChildsTotal.add(this._commentModel.id, nbChildrenTotalDOM);
    if(commentModel.childrenCommentsId.length == commentModel.allChildren.length) {
      allAnswersContainerDOM.hide();
    }

    const nbUpVoteDOM = this.commentView.find('.commentFooter>.infosContainer>.upVoteContainer>.iconContainer');
    allSortFunctions.sortByUpVote.add(this._commentModel.id, nbUpVoteDOM);

    // Test height & width values after selection
    this.commentView.css('width', COMMENT_EXPANDED_WIDTH);
    this.commentView.find('.commentBody').css('max-height', COMMENT_EXPANDED_MAX_HEIGHT);
    this.commentView.find('.commentFooter>.actionsContainer').css('max-height', '100%');
    this._expandedWidth = this.commentView.width();
    this._expandedHeight = this.commentView.height();
    this._actionsContainerHeight = this.commentView.find('.commentFooter>.actionsContainer').height();

    // Return to default height & width
    this.commentView.css('width', COMMENT_DEFAULT_WIDTH);
    this.commentView.find('.commentBody').css('max-height', COMMENT_DEFAULT_MAX_HEIGHT);
    this.commentView.find('.commentFooter>.actionsContainer').css('max-height', '0');
    this._actionsContainerVisible = false;
    this._defaultWidth = this.commentView.width();
    this._defaultHeight = this.commentView.height();

    return this;
  }

  /**
    * Format and change comment date, based on COMMENT_DATE_DISPLAY mode
    * @access public
    */
  formatDate() {
    const dateStr = ((displayMode) => {
      switch (displayMode) {
        case 'FULL':
          return moment(this._commentModel.date).format(localize('COMMENT_DATE_FULL'));
          break;
        case 'WITHOUTYEAR':
          return moment(this._commentModel.date).format(localize('COMMENT_DATE_WITHOUTYEAR'));
          break;
        case 'FROMNOW':
          const diffTime = moment.preciseDiff(moment(this._commentModel.date), moment(), true);
          return momentUtilities.formatDiffDate(diffTime, true);
          break;
        case 'AFTERPARENT':
          if (this._commentModel.parentComment != null) {
            const diffTime = moment.preciseDiff(moment(this._commentModel.date), moment(this._commentModel.parentComment.date), true);
            return momentUtilities.formatDiffDate(diffTime, false);
          } else {
            return moment(this._commentModel.date).format(localize('COMMENT_DATE_FULL'));
          }
          break;
        default:
      }
    })(COMMENT_DATE_DISPLAY.currentValue);

    this.commentView.find('.commentHeader .date').html(dateStr);
  }

  /**
    * Select the comment
    * @access public
    * @param {string} color - The color given to comment border
    */
  select(color) {
    this.selected = true;
    this.commentView.addClass('outline-3 outline-solid');
    this.commentView.css('outline-color', color);

    _.each(this.childRelationsView, (relationView) => {
      relationView.select(1);
    });
    if(this.parentRelationView) {
      this.parentRelationView.select(-1);
    }

    // this.showActionsContainer();
  }

  /**
    * Unselect the comment
    * @access public
    */
  unselect() {
    this.selected = false;
    this.commentView.removeClass(['outline-3', 'outline-solid']);
    this.commentView.css('outline-color', '');

    _.each(this.childRelationsView, (relationView) => {
      relationView.unselect();
    });
    if(this.parentRelationView) {
      this.parentRelationView.unselect();
    }

    // this.hideActionsContainer();
  }

  /**
    * "Select" the comment as a child of the selected comment
    * @access public
    * @param {int} distance - The distance between this comment and the selected comment
    * @param {string} color - The color given to comment border
    */
  selectAsChild(distance, color) {
    this._selectedAsChild = true;
    this.commentView.addClass('outline-3 outline-solid');
    this.commentView.css('outline-color', color);
    _.each(this.childRelationsView, (relationView) => {
      relationView.select(distance + 1);
    });
  }

  /**
    * "Unselect" the comment as a child of the selected comment
    * @access public
    */
  unselectAsChild() {
    this._selectedAsChild = false;
    this.commentView.removeClass(['outline-3', 'outline-solid']);
    this.commentView.css('outline-color', '');
    _.each(this.childRelationsView, (relationView) => {
      relationView.unselect();
    });
  }

  /**
    * "Select" the comment as a parent of the selected comment
    * @access public
    * @param {int} distance - The distance between this comment and the selected comment
    * @param {string} color - The color given to comment border
    */
  selectAsParent(distance, color) {
    this._selectedAsParent = true;
    this.commentView.addClass('outline-3 outline-solid');
    this.commentView.css('outline-color', color);
    if(this.parentRelationView) {
      this.parentRelationView.select(-distance - 1);
    }
  }

  /**
    * "Unselect" the comment as a parent of the selected comment
    * @access public
    */
  unselectAsParent() {
    this._selectedAsParent = false;
    this.commentView.removeClass(['outline-3', 'outline-solid']);
    this.commentView.css('outline-color', '');
    if(this.parentRelationView) {
      this.parentRelationView.unselect();
    }
  }

  /**
    * Hide the comment
    * @access public
    * @param {object} whereToHide - Where the comment should hide
    * @param {int} whereToHide.left - Left coordinate
    * @param {int} whereToHide.top - Top coordinate
    */
  hide(whereToHide) {
    animation_manager.hide(this, whereToHide);
  }

  /**
    * Show the comment
    * @access public
    * @param {object} whereToStart - Where the comment should start before showing
    * @param {int} whereToStart.left - Left coordinate
    * @param {int} whereToStart.top - Top coordinate
    */
  show(whereToStart) {
    animation_manager.show(this, whereToStart);
  }

  /**
    * Resize the comment : if _isExpanded : return to default size, if not : expand
    * @access public
    */
  resize() {
    if (this._isExpanded) {
      this._isExpanded = false;
      animation_manager.animate(this, this.commentView, {
        'width': COMMENT_DEFAULT_WIDTH
      });
      animation_manager.animate(this, this.commentView.find('.commentBody'), {
        'max-height': COMMENT_DEFAULT_MAX_HEIGHT
      });
    }
    else {
      this._isExpanded = true;
      animation_manager.animate(this, this.commentView, {
        'width': COMMENT_EXPANDED_WIDTH
      });
      animation_manager.animate(this, this.commentView.find('.commentBody'), {
        'max-height': COMMENT_EXPANDED_MAX_HEIGHT
      });
    }
  }

  /**
    * Hide the comment actionsContainer
    * @access public
    */
  hideActionsContainer() {
    if (this._actionsContainerVisible && !this.selected) {
      this._actionsContainerVisible = false;
      animation_manager.foldActionsContainer(this);
    }
  }

  /**
    * Show the comment actionsContainer
    * @access public
    */
  showActionsContainer() {
    if (!this._actionsContainerVisible) {
      this._actionsContainerVisible = true;
      animation_manager.unfoldActionsContainer(this, {
        'max-height': this._actionsContainerHeight
      });
    }
  }

  /**
    * Set a background color to the commentView header
    * @access public
    * @param {hexa} color - The color of the comment header
    */
  setHeaderColor(color) {
    const header = this.commentView.find('.commentHeader');
    header.css('background-color', color);
    header.css('color', colors.getTextColorFromBackgroundColor(color));
  }

}

module.exports = {
  CommentView: CommentView
};
