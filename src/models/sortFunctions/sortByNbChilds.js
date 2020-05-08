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
   * @returns {SortByNbChilds} this, all comments sorted and classified by number of direct children
   */
  constructor() {
    super();
    this._label = localize('SORT_FUNCTION_NBCHILDS_LABEL');
    this._measurementLabel = localize('SORT_FUNCTION_NBCHILDS_MEASUREMENT_LABEL');
    this._id = 'sortByNbChilds';
    this._relativeDiffMax = 0.1;
    this._isActive = true;
    this._sortDirection = 'desc';
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
