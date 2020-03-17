/**
 * Project requirements
 */
var sort_function = require("./sortFunction");
var localize = require('../../parameters/localization/localize');

/**
 * Class to sort and classify comments by number of direct children
 */
class SortByNbChilds extends sort_function.SortFunction {
  // --- Vars and accessors

  // --- Functions
  /**
   * Create a SortByNbChilds function
   * @class
   * @param {Object.<CommentModel>} comments - Key : the comment Id. All the comments
   * @returns {SortByNbChilds} this, all comments sorted and classified by number of direct children
   */
  constructor(comments) {
    super(comments, 0.3);
    this._label = localize('SORT_FUNCTION_NBCHILDS_LABEL');
    this._id = 'sortByNbChilds';
    return this;
  }
  /**
   * To sort comments by number of direct children
   * @access private
   * @param {CommentModel} comment - A given comment
   * @returns {Number} The number of direct children of this comment
   */
  getValueToSort(comment) {
    return comment.childrenCommentsId.length;
  }
}

module.exports = {
  SortByNbChilds: SortByNbChilds
};
