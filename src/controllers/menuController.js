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

  // --- Functions
  constructor() {
    return this;
  }
  init(menuView, graphController, graphNavigator) {
    this._menuView = menuView;
    this._graphController = graphController;
    this._graphNavigator = graphNavigator;

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
    });

    $('#menuContainer .sortDiv').click((e) => {
      $(e.currentTarget).toggleClass('active');
      console.log($(e.currentTarget).attr('id'));
    });

    return this;
  }
}

module.exports = new MenuController();
