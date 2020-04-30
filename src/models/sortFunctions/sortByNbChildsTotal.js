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
   * @returns {SortByNbChildsTotal} this, all comments sorted and classified by number total of children
   */
  constructor() {
    super();
    this._label = localize('SORT_FUNCTION_NBCHILDSTOTAL_LABEL');
    this._measurementLabel = localize('SORT_FUNCTION_NBCHILDSTOTAL_MEASUREMENT_LABEL');
    this._id = 'sortByNbChildsTotal';
    this._relativeDiffMax = 0.3;
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
