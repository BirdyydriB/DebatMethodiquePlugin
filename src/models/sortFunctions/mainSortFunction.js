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

      // Link to this._filteredComments
      sortFunction._filteredComments = this._filteredComments;
    });
  }


  classify() {
    const activeFunctions = _.filter(this._allSortFunctions, (sortFunction) => {
      return sortFunction.isActive;
    });
    const sortedActiveFunctions = _.sortBy(activeFunctions, 'weight').reverse();

    if(sortedActiveFunctions.length > 0) {
      this._sortedCommentsScore = [];

      // Calculate score for each comments, as a concat of all actives sort functions classes
      _.each(_.keys(this._graphModel.commentsModel), (commentId) => {
        var commentScores = [];
        _.each(sortedActiveFunctions, (sortFunction) => {
          var currentCommentClass = sortFunction.sortedCommentsScore[sortFunction.commentsIndex[commentId]].classIndex;
          if(sortFunction.sortDirection == 'asc') {
            currentCommentClass = sortFunction.classes.length - currentCommentClass;
          }
          // Pad to 5 digits
          currentCommentClass = ("00000" + currentCommentClass).slice(-5);
          commentScores.push(currentCommentClass);
        });

        this._sortedCommentsScore.push({
          classIndex: null,
          commentId: commentId,
          commentScore: commentScores.join(';')
        });
      });

      // Sort comments
      this._sortedCommentsScore = _.sortBy(this._sortedCommentsScore, (comment) => {
        return comment.commentScore;
      });

      // And save index in this._sortedCommentsScore of each comments
      _.each(this._sortedCommentsScore, (commentScore, index) => {
        this._commentsIndex[commentScore.commentId] = index;
      });

      // Build classes
      this._classes = _.toArray(_.groupBy(this._sortedCommentsScore, 'commentScore'));

      // And save classIndex for each _sortedCommentsScore
      _.each(this._classes, (classComments, index) => {
        this._classes[index] = {
          color: "",
          comments: _.map(classComments, 'commentId')
        };

        var allCommentsFiltered = true;
        _.each(classComments, (comment) => {
          comment.classIndex = index;

          // Filter comment if it's under/over min/max filter
          _.each(sortedActiveFunctions, (sortFunction) => {
            const isFiltered = ((sortFunction.commentsIndex[comment.commentId] < sortFunction.minimumFilterIndex) ||
              (sortFunction.commentsIndex[comment.commentId] >= sortFunction.maximumFilterIndex));
            if(isFiltered) {
              this.filterComment(comment.commentId, sortFunction.id);
            }
          });

          allCommentsFiltered = allCommentsFiltered && (this._filteredComments[comment.commentId] != undefined);
        });

        this._classes[index].filtered = allCommentsFiltered;
      });

      this.setClassesColors();
    }
  }

  setClassesColors() {
    const notFilteredClasses = _.filter(this._classes, (c) => !c.filtered);
    for(var i = 0 ; i < notFilteredClasses.length ; i++) {
      if(notFilteredClasses.length == 1) {
        // Only one class, give a color does not make any sens
        notFilteredClasses[i].color = '#4a5568';
      }
      else {
        // Calculate colors from a gradient : red to green (threw yellow)
        notFilteredClasses[i].color = colors.getGradientColor(GOOD_COLOR, MIDDLE_COLOR, BAD_COLOR, ((notFilteredClasses.length - 1 - i) / (notFilteredClasses.length - 1)));
      }
    }
  }

  filterComment(commentId, sortFunctionId) {
    // Init if needed
    if(!this._filteredComments[commentId]) {
      this._filteredComments[commentId] = []
    }

    // Add new sortFunctionId to this._filteredComments then sort by sortFunction weight
    if(_.indexOf(this._filteredComments[commentId], sortFunctionId) == -1) {
      this._filteredComments[commentId].push(sortFunctionId);
      this._filteredComments[commentId] = _.sortBy(this._filteredComments[commentId], (sortId) => -this._allSortFunctions[sortId].weight);
    }

    // Check if every comments of this class are filtered, filter this class if so
    const filteredClassIndex = this._sortedCommentsScore[this._commentsIndex[commentId]].classIndex;
    var allCommentsFiltered = true;
    _.each(this._classes[filteredClassIndex].comments, (classCommentId) => {
      allCommentsFiltered = allCommentsFiltered && (this._filteredComments[classCommentId] != undefined);
    });
    this._classes[filteredClassIndex].filtered = allCommentsFiltered;
    this.setClassesColors();

    // Propagate to others sort functions
    _.each(this._allSortFunctions, (sortFunction) => {
      sortFunction.setClassesColors();
    });
  }

  unfilterComment(commentId, sortFunctionId) {
    // Delete sortFunctionId from this._filteredComments
    this._filteredComments[commentId] = _.filter(this._filteredComments[commentId], (id) => (id != sortFunctionId));
    if(this._filteredComments[commentId].length == 0) {
      // Not filtered by an other sortFunction : delete
      delete this._filteredComments[commentId];
    }

    // Check if every comments of this class are filtered, unfilter this class if so
    const filteredClassIndex = this._sortedCommentsScore[this._commentsIndex[commentId]].classIndex;
    var allCommentsFiltered = true;
    _.each(this._classes[filteredClassIndex].comments, (classCommentId) => {
      allCommentsFiltered = allCommentsFiltered && (this._filteredComments[classCommentId] != undefined);
    });
    this._classes[filteredClassIndex].filtered = allCommentsFiltered;
    this.setClassesColors();

    // Propagate to others sort functions
    _.each(this._allSortFunctions, (sortFunction) => {
      sortFunction.setClassesColors();
    });
  }



}

module.exports = new MainSortFunction();
