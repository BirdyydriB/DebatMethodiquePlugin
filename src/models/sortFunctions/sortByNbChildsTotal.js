/**
 * External libraries
 */

/**
 * Project requirements
 */
const sort_function = require("./sortFunction");
const localize = require('../../parameters/localization/localize');

/**
 * Class to sort and classify comments by total number of children (children and children of the children and...)
 */
class SortByNbChildsTotal extends sort_function.SortFunction {
  // --- Vars and accessors

  // --- Functions
  /**
   * Create a SortByNbChildsTotal function
   * @class
   * @param {Object.<CommentModel>} comments - Key : the comment Id. All the comments
   * @returns {SortByNbChildsTotal} this, all comments sorted and classified by number total of children
   */
  constructor(comments) {
    super(comments, 0.3);
    this._label = localize('SORT_FUNCTION_NBCHILDSTOTAL_LABEL');
    this._id = 'sortByNbChildsTotal';
    return this;
  }
  /**
   * To sort comments by number total of children
   * @access private
   * @param {CommentModel} comment - A given comment
   * @returns {Number} The number total of children of this comment
   */
  getValueToSort(comment) {
    return comment.allChildren.length;
  }
}

module.exports = {
  SortByNbChildsTotal: SortByNbChildsTotal
};
