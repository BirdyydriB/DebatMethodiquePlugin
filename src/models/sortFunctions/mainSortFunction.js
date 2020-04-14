/**
 * External libraries
 */
const _ = require('underscore');

/**
 * Project requirements
 */
const sortByNbChilds = require("./sortByNbChilds");
const sortByNbChildsTotal = require("./sortByNbChildsTotal");
const sortByUpVote = require("./sortByUpVote");

/**
 *
 */
class MainSortFunction {
  // --- Vars and accessors
  _graphModel; // Singleton | The GraphModel
  get graphModel() {
    return this._graphModel;
  }
  _allSortFunctions;
  get allSortFunctions() {
    return this._allSortFunctions;
  }
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

  // --- Functions
  /**
   * Create MainSortFunction
   * @class
   * @returns {MainSortFunction} this
   */
  constructor() {
    console.log('new mainSortFunction');
    return this;
  }

  init(graphModel) {
    this._graphModel = graphModel;
    this._allSortFunctions = {
      sortByNbChilds: new sortByNbChilds.SortByNbChilds(this._graphModel.commentsModel),
      sortByNbChildsTotal: new sortByNbChildsTotal.SortByNbChildsTotal(this._graphModel.commentsModel),
      sortByUpVote: new sortByUpVote.SortByUpVote(this._graphModel.commentsModel)
    };
  }

  classify() {
    console.log('main classify');
    this._commentsClass = this._allSortFunctions.sortByUpVote.commentsClass;
    this._classes = this._allSortFunctions.sortByUpVote.classes;
    this._graphModel.buildGrid((commentId) => {
      return -this._commentsClass[commentId];
    });
  }

}

module.exports = new MainSortFunction();
