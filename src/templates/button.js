module.exports = `
<div id="<%= btn_id %>" class="button <%= btn_class %> m-1 border-2 border-gray-700 border-solid rounded cursor-pointer hover:bg-gray-200 flex overflow-hidden">
  <% if (typeof icon !== "undefined") { %>
    <div class="iconContainer p-1 self-stretch">
      <iconify-icon data-height="<% (typeof icon_size !== "undefined") ? print(icon_size) : print(18) %>" data-icon="<%= icon %>"></iconify-icon>
    </div>
  <% }
  else { %>
    <div class="labelContainer p-1 self-stretch">
      <span class="inline-block select-none"><%= label %></span>
    </div>
  <% } %>
</div>`;
