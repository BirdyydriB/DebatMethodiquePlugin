var _ = require('underscore');
var localize = require('../parameters/localization/localize');
var button = _.template(require("./button"));
var border = _.template(require("./menuDivider"));
var sortFunction = _.template(require("./sortFunction"));

module.exports = `
<div id="mainMenuBar" class="w-full inline-block">
  <div id="debateTitle" class="float-left h-full flex text-3xl">
    <div id="debateTitleText" class="self-center max-w-lg overflow-hidden whitespace-no-wrap">
      <%= articleTitle %>
    </div>
  </div>` +

  border({
    div_class: 'float-left'
  }) +

  button({
    btn_id: 'centerSelectedButton',
    btn_class: 'float-left',
    icon: 'ic-baseline-slideshow',
    icon_size: 24
  }) +

  button({
    btn_id: 'filterSortButton',
    btn_class: 'float-left',
    label: localize('SORT_FILTER_BUTTON_LABEL')
  }) +

  button({
    btn_id: 'closeButton',
    btn_class: 'float-right',
    icon: 'vaadin-close',
    icon_size: 24
  }) +

`</div>
<div id="sortFilterBar" class="w-full inline-block">
  <% for(var index in allSortFunctions) { %>` +
      sortFunction({
        sort_id: '<%= allSortFunctions[index].id %>',
        sort_class: 'float-left',
        sort_name: '<%= allSortFunctions[index].label %>',
        sort_isActive: '<%= allSortFunctions[index].isActive %>'
      }) +`
  <% } %>
</div>
`;
