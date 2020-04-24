/**
 * Class Definition
 */
class MenuController {
  // --- Vars and accessors
  _menuView; // Singleton | The MenuView
  get menuView() {
    return this._menuView;
  }
  _graphController; // Singleton | The GraphController
  get graphController() {
    return this._graphController;
  }
  _graphNavigator; // Singleton | The GraphNavigator
  get graphNavigator() {
    return this._graphNavigator;
  }
  _sortedFilteredController; // Singleton | The SortedFilteredController
  get sortedFilteredController() {
    return this._sortedFilteredController;
  }

  // --- Functions
  constructor() {
    return this;
  }
  init(menuView, graphController, graphNavigator, sortedFilteredController) {
    this._menuView = menuView;
    this._graphController = graphController;
    this._graphNavigator = graphNavigator;
    this._sortedFilteredController = sortedFilteredController;

    $('#menuContainer #closeButton').click(() => {
      $('#mainContainer').hide();
      $(document.body).css('overflow', 'auto');
      originalContentDOM.show();
      $(document).scrollTop(scrollTopOnLaunch);
    });

    $('#menuContainer #centerSelectedButton').click(() => {
      this.graphNavigator.scrollMainContainerToSelected(false);
    });

    $('#menuContainer #filterSortButton').click(() => {
      $('#menuContainer #filterSortButton').toggleClass('active');
      $('#menuContainer #sortFilterBar').toggle();
      this.sortedFilteredController.toggleSortMode();
    });

    return this;
  }
}

module.exports = new MenuController();
