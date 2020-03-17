var authors = {};
var comments = {};
var articleTitle = '';
var originalContentDOM = null;
var scrollTopOnLaunch = 0;

class Author {
	_id;
	get id() {return this._id;}
	_name;
	get name() {return this._name;}
	_firstCommentDate;
	get firstCommentDate() {return this._firstCommentDate;}
	set firstCommentDate(commentDate) {
		if(commentDate.getTime() < this._firstCommentDate.getTime()) {
			this._firstCommentDate = commentDate;
		}
	}
	_iconSrc;
	get iconSrc() {return this._iconSrc;}
	set iconSrc(val) {this._iconSrc = val;}

	constructor() {
		return this;
	}

	parse(authorId, authorDOM, commentDate, iconSrc) {
		this._id = authorId;
		this._name = authorDOM.children('b').html();
		this._firstCommentDate = commentDate;
		this._iconSrc = iconSrc;

		return this;
	}
}

class Comment {
	_id;
	get id() {return this._id;}
	_oldCommentDOM;
	get oldCommentDOM() {return this._oldCommentDOM;}
	_content;
	get content() {return this._content;}
	_author;
	get author() {return this._author;}
	_date;
	get date() {return this._date;}
	_upVote;
	get upVote() {return this._upVote;}
	_parentCommentId;
	get parentCommentId() {return this._parentCommentId;}
	_parentComment;
	get parentComment() {return this._parentComment;}
	_childrenComments;
	get childrenComments() {return this._childrenComments;}

	constructor() {
		return this;
	}

	parse(commentDOM, parentCommentId) {
		this._oldCommentDOM = commentDOM;

		// Basics infos
		this._parentCommentId = parentCommentId;
		this._parentComment = (parentCommentId == -1) ? null : comments[parentCommentId];
		this._id = commentDOM.attr('id').split('-')[1]; // comment-578067 => 578067
		this._upVote = parseInt(commentDOM.find('.comment-content-actions>.comment-actions>.lclike_container>.lclike_nb').html().substring(1));

		// Content
		this._content = commentDOM.find('.comment-content-actions>.comment-content').html();

		// Date
		var dateStr = commentDOM.find('.comment-info>.comment-date').text();
		var regex = /([0-9]{2})\.([0-9]{2})\.([0-9]{4})\ à ([0-9]{2})h([0-9]{2})/;
		var dateParsed = dateStr.match(regex); // 13.05.2019 à 06h50 => [13.05.2019 à 06h50, 13, 05, 2019, 06, 50]
		this._dateP = dateParsed; //TODO : offset +2
		this._date = new Date(dateParsed[3], parseInt(dateParsed[2]) - 1, dateParsed[1], parseInt(dateParsed[4]) + 2 /* -2 */, dateParsed[5]);

		// Author
		var authorIcon = commentDOM.find('.user-icon>img.avatar');
		var a = $('<a>', {href: authorIcon.attr('data-src')});
		var authorId = a.prop('pathname').split('/')[2]; // /avatar/30e3c3c4aed28ad7bf940c8987f5460d => 30e3c3c4aed28ad7bf940c8987f5460d

		if(authors[authorId] === undefined) {
			authors[authorId] = new Author().parse(authorId, commentDOM.children('.comment-info'), this._date, authorIcon.attr('data-src'));
		}
		else {
			authors[authorId].firstCommentDate = this._date;
		}
		this._author = authors[authorId];

		// Save
		comments[this._id] = this;

		// Childs
		this._childrenComments = [];
		var self = this;
		commentDOM.next('ul.children').children('li').each(function() {
			$(this).children('.comment').each(function() {
				self._childrenComments.push(new Comment().parse($(this), self._id));
			});
		});

		return this;
	}
}

function parseDatas() {
	articleTitle = $('.entry-title').html();

	$('.comments-list>li').each(function() {
		$(this).children('.comment').each(function() {
			new Comment().parse($(this), -1);
		});
	});
}

function addLauncherToDOM() {
	$('#comments').prepend(
	`<div style="border-bottom: 1px solid #cccccc;">
			<h2 class="title" id="DMLauncher" style="cursor: pointer;">
				Débat Méthodique
			</h2>
	</div>`);
}

$(document).ready(function() {
	parseDatas();
	addLauncherToDOM();
	originalContentDOM = $('.wrapper');
	console.log('datas parsed');
});
