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
      this.sortedFilteredController.toggle();
    });

    $('#menuContainer .sortFunction').click((e) => {
      const sortFunctionView = this._graphController.graphView.allSortFunctionsView[$(e.currentTarget).attr('id')];
      sortFunctionView.sortFunctionModel.isActive = !sortFunctionView.sortFunctionModel.isActive;

      if (sortFunctionView.sortFunctionModel.isActive) {
        $(e.currentTarget).addClass('bg-goodColor');
        $(e.currentTarget).removeClass('bg-gray-600');
        sortFunctionView.showAll();
      }
      else {
        $(e.currentTarget).removeClass('bg-goodColor');
        $(e.currentTarget).addClass('bg-gray-600');
        sortFunctionView.hideAll();
      }
    });

    return this;
  }
}

module.exports = new MenuController();
