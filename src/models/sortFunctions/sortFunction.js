/**
 * External libraries
 */
const _ = require('underscore');

/**
 * Project requirements
 */
const {
  GOOD_COLOR,
  MIDDLE_COLOR,
  BAD_COLOR
} = require('../../parameters/constants');
const colors = require("../../utils/colors");

/**
 * Abstract class to sort and classify comments
 */
/*abstract*/ class SortFunction {
  // --- Vars and accessors
  _commentsClass; // Object<int> | Key : the comment Id. The class of this comment
  get commentsClass() {
    return this._commentsClass;
  }
  _classes; /* Array<{color: The color of this class (btw green and red),
                      comments: Array<commentId> | The comments in this class
              }> | All comments, sorted by classes */
  get classes() {
    return this._classes;
  }
  _label; // String | Name of the sort function
  get label() {
    return this._label;
  }
  _id; // String | Id of the sort function
  get id() {
    return this._id;
  }
  _isActive; // Boolean | True if function is active
  get isActive() {
    return this._isActive;
  }
  set isActive(val) {
    return this._isActive = val;
  }

  // --- Functions
  /**
   * Create a SortFunction - throw error if instanciating this abstract class
   * @class
   * @param {Object.<CommentModel>} comments - Key : the comment Id. All the comments
   * @returns {SortFunction} this, all comments sorted and classified
   */
  constructor(comments, relativeDiffMax) {
    if (this.constructor === SortFunction) {
      throw new TypeError('Abstract class "SortFunction" cannot be instantiated directly');
    }

    this._commentsClass = {};
    this.classify(comments, relativeDiffMax);
    this._isActive = true;
    return this;
  }
  /**
   * Function to extend, to sort comments
   * @access private
   * @param {CommentModel} comment - A given comment
   * @returns {Number} The score of this comment with this sort function
   */
  getValueToSort(comment) {
    return 0;
  }
  /**
   * Classify all comments in distinct classes
   * @access private
   * @param {Object.<CommentModel>} comments - Key : the comment Id. All the comments
   * @param {Number} relativeDiffMax - Parameter of "Méthode des grandes différences relatives" for classifying
   */
  classify(comments, relativeDiffMax) {
    // Sort datas
    const sortedComments = _.sortBy(comments, (comment) => {
      return this.getValueToSort(comment);
    });

    // Normalize datas btw 0.1 & 1.1
    const maxVal = this.getValueToSort(sortedComments[sortedComments.length - 1]);
    const normalized = _.map(sortedComments, (comment) => {
      return (this.getValueToSort(comment) / maxVal) + 0.1;
    });

    // Classify using "Méthode des grandes différences relatives"
    this._classes = [{
      color: null,
      comments: [sortedComments[0].id]
    }];
    this._commentsClass[sortedComments[0].id] = 0;

    var currentClassIndex = 0;
    for (var i = 1; i < sortedComments.length; i++) {
      const relativeDiff = ((normalized[i] - normalized[i - 1]) / normalized[i - 1]);

      if (relativeDiff > relativeDiffMax) {
        currentClassIndex++;
        this._classes[currentClassIndex] = {
          color: null,
          comments: []
        };
      }

      this._classes[currentClassIndex].comments.push(sortedComments[i].id);
      this._commentsClass[sortedComments[i].id] = currentClassIndex;
    }

    // Calculate colors from a gradient : red to green (threw yellow)
    for (var i = 0; i < this.classes.length; i++) {
      this._classes[i].color = colors.getGradientColor(BAD_COLOR, MIDDLE_COLOR, GOOD_COLOR, (i / (this.classes.length - 1)));
    }
  }

}

module.exports = {
  SortFunction: SortFunction
};
