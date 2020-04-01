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

}

module.exports = new MainSortFunction();
