module.exports = `
<div id="<%= sort_id %>" class="sortDiv <%= sort_class %> <% sort_isActive ? print('bg-green-600') : print('bg-gray-400') %> mx-1 py-1 px-4 rounded-full cursor-pointer select-none">
  <%= sort_name %>
</div>`;
