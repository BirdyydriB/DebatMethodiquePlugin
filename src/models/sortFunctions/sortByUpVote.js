/**
 * Project requirements
 */
var sort_function = require("./sortFunction");
var localize = require('../../parameters/localization/localize');

/**
 * Class to sort and classify comments by number of up vote
 */
class SortByUpVote extends sort_function.SortFunction {
  // --- Vars and accessors

  // --- Functions
  /**
   * Create a SortByUpVote function
   * @class
   * @returns {SortByUpVote} this, all comments sorted and classified by number of up vote
   */
  constructor() {
    super();
    this._label = localize('SORT_FUNCTION_UPVOTE_LABEL');
    this._measurementLabel = localize('SORT_FUNCTION_UPVOTE_MEASUREMENT_LABEL');
    this._id = 'sortByUpVote';
    this._relativeDiffMax = 0.1;
    return this;
  }
  /**
   * To sort comments by number of up vote
   * @access private
   * @param {CommentModel} comment - A given comment
   * @returns {Number} The number of up vote of this comment
   */
  getValueToSort(comment) {
    return comment.upVote;
  }
}

module.exports = {
  SortByUpVote: SortByUpVote
};
