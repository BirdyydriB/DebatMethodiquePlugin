/**
 * External libraries
 */
var _ = require('underscore');

/**
 * The model of a comment
 */
class CommentModel extends Comment {
  // --- Vars and accessors
  _allParents; // Array<CommentId> | All the parents of this comments
  get allParents() {
    return this._allParents;
  }
  _childrenCommentsId; // Array<CommentId> | All the direct children
  get childrenCommentsId() {
    return this._childrenCommentsId;
  }
  set childrenCommentsId(val) {
    this._childrenCommentsId = val;
  }
  _allChildren; // Array<CommentId> | All the children and children of the children...
  get allChildren() {
    return this._allChildren;
  }
  set allChildren(val) {
    this._allChildren = val;
  }
  _visible; // bool | True if this comment should be 'logically' visible
  get visible() {
    return this._visible;
  }
  _isFolded; // bool | True if this comment should be 'logically' folded
  get isFolded() {
    return (this._childrenCommentsId.length == 0) || this._isFolded;
  }

  // --- Functions
  /**
   * Create a CommentModel
   * @class
   * @returns {CommentModel} this
   */
  constructor() {
    super();
    this._allParents = [];
    this._allChildren = [];
    this._visible = true;
    this._isFolded = false;
    return this;
  }
  /**
    * Init the CommentModel
    * @access public
    * @param {Comment} element - The parsed comment object
    * @returns {CommentModel} this
    */
  init(element) {
    _.extend(this, element);

    // Climb the tree to get an array of all parents
    var currentParent = this._parentComment;
    while (currentParent != null) {
      this._allParents.unshift(currentParent.id);
      currentParent = currentParent.parentComment;
    }
    // Reduce children to an id array
    this._childrenCommentsId = _.pluck(this.childrenComments, 'id');

    // Initialize list of all children, starting with direct children. Will be completed by graphModel.
    this._allChildren = this._childrenCommentsId.map((x) => x);

    return this;
  }
  /**
    * Hide this. Trigger 'hideComment'
    * @access public
    */
  hide() {
    this._visible = false;
    $(document).trigger('hideComment', [this]);
  }
  /**
    * Show this. Trigger 'showComment'
    * @access public
    */
  show() {
    this._visible = true;
    $(document).trigger('showComment', [this]);
  }
  /**
    * Fold this
    * @access public
    */
  fold() {
    this._isFolded = true;
  }
  /**
    * Unfold this
    * @access public
    */
  unfold() {
    this._isFolded = false;
  }
}

module.exports = {
  CommentModel: CommentModel
};
