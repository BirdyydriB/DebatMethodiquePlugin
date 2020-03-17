module.exports = `
<div id="<%= icon_id %>" class="<%= icon_class %> m-1 border-2 border-gray-700 border-solid rounded flex overflow-hidden">
  <div class="iconContainer p-1 self-stretch">
    <iconify-icon data-width="18" class="" data-icon="<%= icon %>"></iconify-icon>
  </div>
  <span class="mx-1 self-center select-none"><%= value %></span>
</div>`;
