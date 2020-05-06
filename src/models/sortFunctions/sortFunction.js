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
  _id; // String | Id of the sort function
  get id() {
    return this._id;
  }
  _sortedCommentsScore; /* Array<{commentScore | the comment score given by getValueToSort()
                                  commentId | the Id of the comment
                                  classIndex | the comment class index in _classes
                          }> | The sorted comments, by score */
  get sortedCommentsScore() {
    return this._sortedCommentsScore;
  }
  _commentsIndex; // Object<int> | Key : the comment Id. The index of this comment in this._sortedCommentsScore
  get commentsIndex() {
    return this._commentsIndex;
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
  _classifyMethod;
  get classifyMethod() {
    return this._classifyMethod;
  }
  _relativeDiffMax; // Number | Parameter of "Méthode des grandes différences relatives" for classifying
  get relativeDiffMax() {
    return this._relativeDiffMax;
  }
  set relativeDiffMax(val) {
    this._relativeDiffMax = val;
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
  setSortDirection(val) {
    const rslt = (this._sortDirection = val);
    if(val != '') {
      this.updateClassesColors();
    }
    return rslt;
  }
  _weight; // Number | Weight of this sort function, compared to other sort functions, in mainSortFunction calculation.
  get weight() {
    return this._weight;
  }
  set weight(val) {
    return this._weight = val;
  }
  _minimumFilter; // Number | Each data < to this should be filtered
  get minimumFilter() {
    return this._minimumFilter;
  }
  set minimumFilter(val) {
    return this._minimumFilter = val;
  }
  _maximumFilter; // Number | Each data > to this should be filtered
  get maximumFilter() {
    return this._maximumFilter;
  }
  set maximumFilter(val) {
    return this._maximumFilter = val;
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

    this._sortedCommentsScore = [];
    this._commentsIndex = {};
    this._isActive = false;
    this._sortDirection = '';
    this._weight = 0;
    this._classifyMethod = 'largeRelativeDifferenceMethod';
    return this;
  }

  init(comments) {
    _.each(comments, (comment) => {
      const commentScore = this.getValueToSort(comment);
      this._sortedCommentsScore.push({
        commentScore: commentScore,
        commentId: comment.id
      });
    });

    this._sortedCommentsScore = _.sortBy(this._sortedCommentsScore, (comment) => {
      return comment.commentScore;
    });

    _.each(this._sortedCommentsScore, (commentScore, index) => {
      this._commentsIndex[commentScore.commentId] = index;
    });

    this._minimumFilter = -0.1;
    this._maximumFilter = this._sortedCommentsScore[this._sortedCommentsScore.length - 1].commentScore + 0.1;

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
   */
  classify() {
    if(this._classifyMethod == 'largeRelativeDifferenceMethod') {
      // Classify using "Méthode des grandes différences relatives"
      var classChange = this.largeRelativeDifferenceMethod();
    }
    else if(this._classifyMethod == 'sameSizeClasses') {
      this.sameSizeClasses();
    }

    this.updateClassesColors();

    if(classChange) {
      // Randomify comments of same classes
      _.each(this._classes, (commentsClass) => {
        commentsClass.comments = _.shuffle(commentsClass.comments);
      });
    }

    return classChange;
  }

  sameSizeClasses() {
    this._classes = [];
    const chunkedComments = _.chunk(this._sortedCommentsScore, this._chunkSize);

    for (var currentClassIndex = 0; currentClassIndex < chunkedComments.length; currentClassIndex++) {
      this._classes[currentClassIndex] = {
        color: null,
        comments: []
      };
      _.each(chunkedComments[currentClassIndex], (comment) => {
        this._classes[currentClassIndex].comments.push(comment.commentId);
        comment['classIndex'] = currentClassIndex;
      });
    }
  }

  largeRelativeDifferenceMethod() {
    var classChange = false;
    // Normalize datas btw 0.1 & 1.1
    const maxVal = this._sortedCommentsScore[this._sortedCommentsScore.length - 1].commentScore;
    const normalized = _.map(this._sortedCommentsScore, (comment) => {
      return (comment.commentScore / maxVal) + 0.1;
    });

    var currentClassIndex = 0;
    this._classes = [{
      color: null,
      comments: [this._sortedCommentsScore[0].commentId]
    }];
    classChange = classChange || (this._sortedCommentsScore[0]['classIndex'] != 0);
    this._sortedCommentsScore[0]['classIndex'] = 0;

    for (var i = 1; i < normalized.length; i++) {
      const relativeDiff = ((normalized[i] - normalized[i - 1]) / normalized[i - 1]);

      if (relativeDiff > this._relativeDiffMax) {
        // Init new class
        currentClassIndex++;
        this._classes[currentClassIndex] = {
          color: null,
          comments: []
        };
      }

      this._classes[currentClassIndex].comments.push(this._sortedCommentsScore[i].commentId);
      classChange = classChange || (this._sortedCommentsScore[i]['classIndex'] != currentClassIndex);
      this._sortedCommentsScore[i]['classIndex'] = currentClassIndex;
    }

    return classChange;
  }

  updateClassesColors() {
    this._minimumFilterIndex = Math.max(0, _.sortedIndex(this._sortedCommentsScore, {commentScore: this._minimumFilter}, 'commentScore'));
    const minClass = this._sortedCommentsScore[this._minimumFilterIndex].classIndex;

    this._maximumFilterIndex = Math.min(this._sortedCommentsScore.length, _.sortedIndex(this._sortedCommentsScore, {commentScore: this._maximumFilter}, 'commentScore'));
    const maxClass = this._sortedCommentsScore[this._maximumFilterIndex - 1].classIndex;

    for (var i = 0 ; i < this._classes.length ; i++) {
      if((this._classes.length == 1) || (minClass == maxClass) || (i < minClass) || (i > maxClass)) {
        // Only one class, or all of this class comments filtered : give a color does not make any sens
        this._classes[i].color = '';
      }
      else {
        // Calculate colors from a gradient : red to green (threw yellow)
        var firstColor, lastColor;
        if(this._sortDirection == 'asc') {
          firstColor = BAD_COLOR;
          lastColor = GOOD_COLOR;
        }
        else {
          firstColor = GOOD_COLOR;
          lastColor = BAD_COLOR;
        }

        this._classes[i].color = colors.getGradientColor(firstColor, MIDDLE_COLOR, lastColor, ((maxClass - i) / (maxClass - minClass)));
      }
    }

  }

}

module.exports = {
  SortFunction: SortFunction
};
