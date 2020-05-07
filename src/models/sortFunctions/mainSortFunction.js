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
const sortByNbChilds = require("./sortByNbChilds");
const sortByNbChildsTotal = require("./sortByNbChildsTotal");
const sortByUpVote = require("./sortByUpVote");
const sort_function = require("./sortFunction");

/**
 *
 */
class MainSortFunction extends sort_function.SortFunction {
  // --- Vars and accessors
  _graphModel; // Singleton | The GraphModel
  get graphModel() {
    return this._graphModel;
  }
  _allSortFunctions;
  get allSortFunctions() {
    return this._allSortFunctions;
  }
  _filteredComments;
  get filteredComments() {
    return this._filteredComments;
  }

  // --- Functions
  /**
   * Create MainSortFunction
   * @class
   * @returns {MainSortFunction} this
   */
  constructor() {
    super();
    this._label = 'mainSortFunction';
    this._id = 'mainSortFunction';
    this._filteredComments = {};
    return this;
  }

  init(graphModel) {
    console.log('mainSortFunction init');
    this._graphModel = graphModel;
    this._allSortFunctions = {
      sortByNbChilds: new sortByNbChilds.SortByNbChilds(),
      sortByNbChildsTotal: new sortByNbChildsTotal.SortByNbChildsTotal(),
      sortByUpVote: new sortByUpVote.SortByUpVote()
    };

    _.each(this._allSortFunctions, (sortFunction) => {
      sortFunction.init(this._graphModel.commentsModel)
        .classify();
    });
  }

  classifyRec(commentsByClass, sortFunction) {
    var result = [];
    for(var commentClass of commentsByClass) {

      var currentClassSplitted = [];
      for(var commentId of commentClass) {

        const commentIndex = sortFunction.commentsIndex[commentId];
        if((commentIndex >= sortFunction.minimumFilterIndex) && (commentIndex < sortFunction.maximumFilterIndex)) {
          // Comment not filtered
          const commentScore = (sortFunction.sortDirection == 'asc') ?
            (sortFunction.classes.length - sortFunction.sortedCommentsScore[commentIndex].classIndex) :
            sortFunction.sortedCommentsScore[commentIndex].classIndex;

          if(!currentClassSplitted[commentScore]) {
            currentClassSplitted[commentScore] = [];
          }
          currentClassSplitted[commentScore].push(commentId);
        }
        else {
          // Comment filtered
          this._filteredComments[commentId] = sortFunction.id;
        }
      }

      _.each(currentClassSplitted, (comments) => {
        if(comments) {
          result.push(comments);
        }
      });
    }

    return result;
  }

  classify() {
    console.log('mainSortFunction classify');
    const activeFunctions = _.filter(this._allSortFunctions, (sortFunction) => {
      return sortFunction.isActive;
    });
    const sortedActiveFunctions = _.sortBy(activeFunctions, 'weight').reverse();

    var commentsByClass = [];
    this._filteredComments = {};
    if(sortedActiveFunctions.length > 0) {
      for(var commentIndex = 0 ; commentIndex < sortedActiveFunctions[0].sortedCommentsScore.length ; commentIndex++) {
        if((commentIndex >= sortedActiveFunctions[0].minimumFilterIndex) && (commentIndex < sortedActiveFunctions[0].maximumFilterIndex)) {
          // Comment not filtered
          const currentClassIndex = sortedActiveFunctions[0].sortedCommentsScore[commentIndex].classIndex;
          if(!commentsByClass[currentClassIndex]) {
            commentsByClass[currentClassIndex] = [];
          }
          commentsByClass[currentClassIndex].push(sortedActiveFunctions[0].sortedCommentsScore[commentIndex].commentId);
        }
        else {
          // Comment filtered
          const commentId = sortedActiveFunctions[0].sortedCommentsScore[commentIndex].commentId;
          this._filteredComments[commentId] = sortedActiveFunctions[0].id;
        }
      }

      commentsByClass = _.values(commentsByClass);
      if(sortedActiveFunctions[0].sortDirection == 'asc') {
        commentsByClass = commentsByClass.reverse();
      }

      // Then (recursivly) classify comments of a same class, with next sort function
      for(var i = 1 ; i < sortedActiveFunctions.length ; i++) {
        commentsByClass = this.classifyRec(commentsByClass, sortedActiveFunctions[i]);
      }
    }
    else {
      commentsByClass = [_.keys(this._graphModel.commentsModel)];
    }

    // Save classifying results into classes
    this._classes = [];
    this._commentsIndex = [];
    this._sortedCommentsScore = [];
    var commentIndex = 0;
    for (var i = 0; i < commentsByClass.length; i++) {
      const classColor = (commentsByClass.length == 1) ?
        '' : // Only one class, give a color does not make any sens
        colors.getGradientColor(BAD_COLOR, MIDDLE_COLOR, GOOD_COLOR, (i / (commentsByClass.length - 1)));

      this._classes[i] = {
        color: classColor,
        comments: commentsByClass[i]
      };
      _.each(commentsByClass[i], (commentId) => {
        this._commentsIndex[commentId] = commentIndex;
        this._sortedCommentsScore[commentIndex] = {
          classIndex: i,
          commentId: commentId
        };
        commentIndex++;
      });
    }

    console.log(this);
    // Sort all comments in graph
    this._graphModel.buildGrid((commentId) => {
      if(!this._commentsIndex[commentId]) {
        return 9999;
      }
      return -this._sortedCommentsScore[this._commentsIndex[commentId]].classIndex;
    });
  }

}

module.exports = new MainSortFunction();
