/**
 * Class that manage the relation between two comments
 */
class RelationModel {
  // --- Vars and accessors
  _parent; // CommentModel || The parent of the relation
  get parent() {
    return this._parent;
  }
  _child; // CommentModel || The child of the relation
  get child() {
    return this._child;
  }

  // --- Functions
  /**
   * Create a new RelationModel
   * @class
   * @param {string} parentId - The id of parent comment
   * @param {string} childId - The id of child comment
   * @returns {RelationModel} this
   */
  constructor(parentId, childId) {
    this._parent = comments[parentId];
    this._child = comments[childId];
    return this;
  }

  /**
    * Init the RelationModel
    * @access public
    * @returns {RelationModel} this
    */
  init() {
    return this;
  }
}

module.exports = {
  RelationModel: RelationModel
};
