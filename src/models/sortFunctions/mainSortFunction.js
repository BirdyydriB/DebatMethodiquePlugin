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
      sortFunction.classify(this._graphModel.commentsModel);
    });
  }

  classify() {
    console.log('mainSortFunction classify');
    const activeFunctions = _.filter(this._allSortFunctions, (sortFunction) => {
      return sortFunction.isActive;
    });
    const sortedActiveFunctions = _.sortBy(activeFunctions, 'weight').reverse();

    var commentsByClass = [];
    if(sortedActiveFunctions.length > 0) {
      commentsByClass = _.map(sortedActiveFunctions[0].classes, (commentsClass) => {
        return commentsClass.comments;
      });
      if(sortedActiveFunctions[0].sortDirection == 'asc') {
        commentsByClass = commentsByClass.reverse();
      }

      for(var i = 1 ; i < sortedActiveFunctions.length ; i++) {
        var currentFunctionClasses = [];
        // Foreach classes of comments
        for(var j = 0 ; j < commentsByClass.length ; j++) {
          // GroupBy by current sort function classes
          currentFunctionClasses.push(_.toArray(_.groupBy(commentsByClass[j], (commentId) => {
            return (sortedActiveFunctions[i].sortDirection == 'asc') ?
              (sortedActiveFunctions[i].classes.length - sortedActiveFunctions[i].commentsClass[commentId]) :
              sortedActiveFunctions[i].commentsClass[commentId];
          })));
        }

        // Flatten result and save to classes of comments
        commentsByClass = _.flatten(currentFunctionClasses, true);
      }
    }
    else {
      commentsByClass = [_.keys(this._graphModel.commentsModel)];
    }

    // Save results into classes
    this._classes = [];
    this._commentsClass = {};
    for (var i = 0; i < commentsByClass.length; i++) {
      const classColor = (commentsByClass.length == 1) ?
        '' : // Only one class, give a color does not make any sens
        colors.getGradientColor(BAD_COLOR, MIDDLE_COLOR, GOOD_COLOR, (i / (commentsByClass.length - 1)));

      this._classes[i] = {
        color: classColor,
        comments: _.shuffle(commentsByClass[i]) // Randomify comments is a same class
      };
      _.each(commentsByClass[i], (commentId) => {
        this._commentsClass[commentId] = i;
      });
    }

    // Sort all comments in graph
    this._graphModel.buildGrid((commentId) => {
      return -this._commentsClass[commentId];
    });
  }

}

module.exports = new MainSortFunction();
