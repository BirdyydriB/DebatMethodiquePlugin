"use strict";
var _ = require('underscore');

var template_index = require("./templates/index");
var momentUtilities = require('./utils/moment-utilities');
var menuView = require("./views/menuView");
var graphModel = require("./models/graphModel");
var graphView = require("./views/graphView");
var graphController = require("./controllers/graphController");
var graphNavigator = require("./controllers/graphNavigator");
var menuController = require("./controllers/menuController");
var sortedFilteredController = require("./controllers/sortedFilteredController");
// browser.runtime.onMessage.addListener(main);

function main(request, sender, sendResponse) {
  console.log('main Start', request.answer);

  if (request.answer == 'Ouvrir') {
    $(document.body).css('overflow', 'hidden');
    originalContentDOM.hide();

    if($('#mainContainer').length == 0) {
      $(document.body).prepend(_.template(template_index, {}));
      momentUtilities.initMoment();
      graphModel.init();
      graphView.init(graphModel);
      menuView.init(graphModel);
      graphNavigator.init(graphModel, graphView);
      graphController.init(graphModel, graphView, graphNavigator);
      sortedFilteredController.init(graphModel, graphView, graphNavigator);
      menuController.init(menuView, graphController, graphNavigator, sortedFilteredController);
    }
    else {
      $('#mainContainer').show();
    }
  }

  // browser.runtime.onMessage.removeListener(main);
}


$(document).ready(function() {
  $('#DMLauncher').click(function(e) {
    scrollTopOnLaunch = $(document).scrollTop();
    console.log('start !', scrollTopOnLaunch);
    main({
      answer: 'Ouvrir'
    }, null, null);
  });
});
