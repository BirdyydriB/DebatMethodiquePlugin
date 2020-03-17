var _ = require('underscore');
var iconText = _.template(require("./iconText"));
var button = _.template(require("./button"));

module.exports = `
<div id="<%= id %>" class="commentContainer absolute shadow-xl flex flex-col">

	<div class="commentHeader bg-gray-700 text-white flex">
		<div class="p-1 flex-1 flex">
			<img src="<%= iconSrc %>" class="authorIcon rounded h-12 w-12" alt="<%= author %>" width="48" height="48"/>
			<span class="author px-1 self-end flex-none">
				<%= author %> <%= id %>
			</span>
		</div>

		<div class="p-1 flex-1 self-stretch flex justify-center">
			<div class="date self-start text-center select-none cursor-pointer flex-none">
			</div>
		</div>

		<div class="p-1 flex-1 self-stretch">
		</div>
	</div>

	<div class="commentBody p-1 overflow-auto bg-white">
		<%= content %>
	</div>

	<div class="commentFooter p-1 bg-white">
		<div class="infosContainer flex">` +
		  iconText({
				icon_id: '',
		    icon_class: 'answersContainer',
		    icon: 'mdi-comment-text-outline',
		    value: `<%= nbChildren %>`
		  }) +
			iconText({
				icon_id: '',
		    icon_class: 'allAnswersContainer',
		    icon: 'mdi-comment-text-multiple-outline',
		    value: `<%= nbChildrenTotal %>`
		  }) +
		  iconText({
				icon_id: '',
		    icon_class: 'upVoteContainer',
		    icon: 'mdi-thumb-up',
		    value: `<%= upVote %>`
		  }) + `
		</div>
		<div class="showActionsContainer flex justify-center h-0">
			<iconify-icon data-width="18" class="relative w-full h-5" data-icon="ls-etc"></iconify-icon>
		</div>
		<div class="actionsContainer flex">` +
		  button({
				btn_id: '',
		    btn_class: 'followButton',
		    icon: 'mdi-bell'
		  }) + `
		</div>
	</div>
</div>
`;
