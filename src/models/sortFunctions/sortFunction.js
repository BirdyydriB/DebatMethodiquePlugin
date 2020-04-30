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
  _measurementLabel; // String | Measurement name
  get measurementLabel() {
    return this._measurementLabel;
  }
  _id; // String | Id of the sort function
  get id() {
    return this._id;
  }
  _classifyMethod;
  get classifyMethod() {
    return this._classifyMethod;
  }
  _relativeDiffMax; // Number | Parameter of "Méthode des grandes différences relatives" for classifying
  get relativeDiffMax() {
    return this._relativeDiffMax;
  }
  _chunkSize;
  get chunkSize() {
    return this._chunkSize;
  }
  _isActive; // Boolean | True if function is active
  get isActive() {
    return this._isActive;
  }
  set isActive(val) {
    return this._isActive = val;
  }
  _sortDirection; // String | asc|desc
  get sortDirection() {
    return this._sortDirection;
  }
  set sortDirection(val) {
    return this._sortDirection = val;
  }
  _weight; // Number | Weight of this sort function, compared to other sort functions, in mainSortFunction calculation.
  get weight() {
    return this._weight;
  }
  set weight(val) {
    return this._weight = val;
  }

  // --- Functions
  /**
   * Create a SortFunction - throw error if instanciating this abstract class
   * @class
   * @param {Object.<CommentModel>} comments - Key : the comment Id. All the comments
   * @returns {SortFunction} this, all comments sorted and classified
   */
  constructor() {
    if (this.constructor === SortFunction) {
      throw new TypeError('Abstract class "SortFunction" cannot be instantiated directly');
    }

    this._commentsClass = {};
    this._isActive = false;
    this._sortDirection = '';
    this._weight = 0;
    this._classifyMethod = 'largeRelativeDifferenceMethod';
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
  classify(comments, classifyArgument) {
    // Sort datas
    const sortedComments = _.sortBy(comments, (comment) => {
      const commentScore = this.getValueToSort(comment);
      this._commentsClass[comment.id] = {
        classIndex: null,
        commentScore: commentScore
      };
      return commentScore;
    });

    if(this._classifyMethod == 'largeRelativeDifferenceMethod') {
      // Classify using "Méthode des grandes différences relatives"
      this.largeRelativeDifferenceMethod(sortedComments, this._relativeDiffMax);
    }
    else if(this._classifyMethod == 'sameSizeClasses') {
      this.sameSizeClasses(sortedComments, this._chunkSize);
    }

    console.log(this._label, this._commentsClass, this._classes);

    for (var i = 0; i < this._classes.length; i++) {
      if(this._classes.length == 1) {
        // Only one class, give a color does not make any sens
        this._classes[0].color = '';
      }
      else {
        // Calculate colors from a gradient : red to green (threw yellow)
        this._classes[i].color = colors.getGradientColor(BAD_COLOR, MIDDLE_COLOR, GOOD_COLOR, (i / (this.classes.length - 1)));
      }
      // Randomify comments is a same class
      this._classes[i].comments = _.shuffle(this._classes[i].comments);
    }
  }

  sameSizeClasses(sortedComments, chunkSize) {
    this._classes = [];
    this._commentsClass = {};
    const chunkedComments = _.chunk(sortedComments, chunkSize);

    for (var currentClassIndex = 0; currentClassIndex < chunkedComments.length; currentClassIndex++) {
      this._classes[currentClassIndex] = {
        color: null,
        comments: []
      };
      _.each(chunkedComments[currentClassIndex], (comment) => {
        this._classes[currentClassIndex].comments.push(comment.id);
        this._commentsClass[comment.id]['classIndex'] = currentClassIndex;
      });
    }
  }

  largeRelativeDifferenceMethod(sortedComments, relativeDiffMax) {
    // Normalize datas btw 0.1 & 1.1
    const maxVal = this._commentsClass[sortedComments[sortedComments.length - 1].id].commentScore;
    const normalized = _.map(sortedComments, (comment) => {
      return (this._commentsClass[comment.id].commentScore / maxVal) + 0.1;
    });

    var currentClassIndex = 0;
    this._classes = [{
      color: null,
      comments: [sortedComments[0].id]
    }];
    this._commentsClass[sortedComments[0].id]['classIndex'] = 0;

    for (var i = 1; i < sortedComments.length; i++) {
      const relativeDiff = ((normalized[i] - normalized[i - 1]) / normalized[i - 1]);

      if (relativeDiff > relativeDiffMax) {
        // Init new class
        currentClassIndex++;
        this._classes[currentClassIndex] = {
          color: null,
          comments: []
        };
      }

      this._classes[currentClassIndex].comments.push(sortedComments[i].id);
      this._commentsClass[sortedComments[i].id]['classIndex'] = currentClassIndex;
    }
  }

}

module.exports = {
  SortFunction: SortFunction
};
