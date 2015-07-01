// coOp.js v0.1
//
var coOp = function (targetEditor, options) {
	'use strict';

	console.log('hhas');
	

	var that = this,
		editor = document.getElementById(targetEditor),
		userId = options.userId || 'user_' + new Date().getSeconds(),
		paragraphs = {
			editor: editor,
			data: []
		};

	if (options.data !== undefined) {
		editor.innerHTML = '';
		for (var d = 0; d < options.data.length; d++) {
			var p = document.createElement('p');

			p.id = options.data[d].id;
			p.innerHTML = options.data[d].text;
			editor.appendChild(p);

			paragraphs.data.push({ text: options.data[d].text, lock: options.data[d].lock, id: options.data[d].id });
		}
	} else {
		var p = document.createElement('p');

		p.id = new Date().getTime();
		p.innerHTML = '&nbsp;';

		editor.appendChild(p);
	}

	//demo purpose
	document.getElementById('theUser').innerHTML = userId;


	this.setMarker = function () {
		var paragraph = editor.getElementsByTagName('p'),
			currentPos = that.findPosition(window.getSelection().getRangeAt(0).startContainer);

		//console.log(event.currentTarget.id)
		// set color and lock
		that.setColorAndLock(function () {
			if (paragraphs.data[currentPos.row].lock === '') {
				//paragraphs.data[currentPos.row].lock = userId;

				//window.getSelection().getRangeAt(0).startContainer.parentNode.className = 'userColor1';

				//socket.emit('sendText', paragraphs);
			} else {
				window.getSelection().getRangeAt(0).startContainer.parentNode.className = 'userLocked';	
			}
		});
	};				

	this.findPosition = function (startContainer) {
		var row = 0,
			col = window.getSelection().getRangeAt(0).startOffset,
			parentElement = startContainer.parentNode;
		
		/*if (startContainer.nodeType === 1) {
			parentElement = startContainer.previousSibling;
		} else {
			parentElement = startContainer.parentNode.previousSibling;
		}*/
						
		// find the current row/paragraph
		console.log('parentElement', parentElement);
		if (parentElement !== null) {
			while (parentElement.previousSibling !== null) {
				if (parentElement.nodeType !== 3) {
					row += 1;
				}
				
				parentElement = parentElement.previousSibling;
			}
		}
		return { row: row, col: col };
	};

	this.setCaret = function (currentPos) {
		var paragraph = editor.getElementsByTagName('p'),
			range = document.createRange(),
			currentNode = paragraph[currentPos.row].firstChild,
			sel = window.getSelection();

		range.setStart(currentNode, (currentPos.col));
		range.setEnd(currentNode, (currentPos.col));
	
		sel.removeAllRanges();
		sel.addRange(range);
	};

	this.setColorAndLock = function (callback) {
		var paragraph = editor.getElementsByTagName('p');

		// remove users lock/color
		for (var p = 0; p < paragraph.length; p++) {
			paragraph[p].classList.remove('userColor1');
			paragraph[p].classList.remove('userLocked');
		}

		// looping through data object
		for (var i = 0; i < paragraphs.data.length; i++) {
			if (paragraphs.data[i].lock === userId) {
				paragraphs.data[i].lock = '';
			} else if (paragraphs.data[i].lock !== userId && paragraphs.data[i].lock !== '') {
				window.getSelection().getRangeAt(0).startContainer.parentNode.className = 'userLocked';
			}
		}

		if (callback !== undefined) {
			callback();
		}				
	};


	this.keyUp = function () {
		console.log('editor:', that);
		
		var paraPos = window.getSelection().getRangeAt(0).startOffset,
			paragraph = editor.getElementsByTagName('p'),
			currentPos = that.findPosition(window.getSelection().getRangeAt(0).startContainer);

		// set color and lock
		that.setColorAndLock();

		if (event.shiftKey) {
			return false;
		}

		if (event.keyCode !== 13) { // if not enter
			console.log('current row:', currentPos.row);
			console.log('text:', paragraphs.data[currentPos.row].text);
			//console.log('new text:', paragraph[currentPos.row].innerHTML);
			if (paragraphs.data[currentPos.row].lock === '' || paragraphs.data[currentPos.row].lock === userId) {
				paragraphs.data[currentPos.row].text = paragraph[currentPos.row].innerHTML;
				paragraphs.data[currentPos.row].lock = userId;
				
				if (!window.getSelection().getRangeAt(0).startContainer.parentNode.classList.contains('editor')) {
					window.getSelection().getRangeAt(0).startContainer.parentNode.className = 'userColor1';
				}
			} else {
				// set userlock class and remove typed characters
				paragraph[currentPos.row].className = 'userLocked';
				paragraph[currentPos.row].innerHTML = paragraphs.data[currentPos.row].text;


				that.setCaret(currentPos);
			}					
		}
		
		

		console.log('paragraphs', paragraphs);

		if (event.keyCode === 8 || event.keyCode === 46) { // if backspace or delete
			var currentPara = editor.getElementsByTagName('p');

			console.log(editor.getElementsByTagName('p').length);
			console.log(paragraphs.data.length);

			if (currentPara.length < paragraphs.data.length) { // if something was removed
				paragraphs.data = [];
				//paragraphs.index = [];
				// check on id

				for (var c = 0; c < currentPara.length; c++) {
					
					console.log('new line:', currentPara[c].innerHTML);
					paragraphs.data.push({ text: currentPara[c].innerHTML, lock: '', id: parseInt(currentPara[c].id) });
					//paragraphs.index.push(paragraphs.data.length);
				}

				console.log('after delete loop:', paragraphs);

				//socket.emit('sendText', paragraphs);
			}

			//return false;
		}
		
		if (event.keyCode === 13) { // if enter
			document.execCommand('formatBlock', false, '<p>');
			
			window.getSelection().focusNode.innerHTML = '&nbsp;';
			
			var newPos = that.findPosition(window.getSelection().getRangeAt(0).startContainer);
			var time = new Date().getTime();

			//newPos.row += 1;
			window.getSelection().focusNode.id = time;

			if ((newPos.row + 1) === paragraphs.data.length && window.getSelection().getRangeAt(0).startContainer.previousSibling !== null) { // if last line
				paragraphs.data.splice((newPos.row + 1), 0, { text: '', lock: userId, id: time });
				//paragraphs.index.splice((newPos.row), 0, (paragraphs.data.length));
				window.getSelection().getRangeAt(0).startContainer.previousSibling.classList.remove('userColor1');
			} else {
				if (newPos.row < paragraphs.data.length) { // if a line was cutted by new line
					paragraphs.data[newPos.row - 1].text = editor.getElementsByTagName('p')[newPos.row - 1].innerHTML;
					paragraphs.data.splice(newPos.row, 0, { text: editor.getElementsByTagName('p')[newPos.row].innerHTML, lock: userId, id: time });
				} else {
					paragraphs.data.splice((newPos.row - 1), 0, { text: '', lock: userId, id: time });
				}
				
				//paragraphs.index.splice((newPos.row), 0, (paragraphs.data.length - 1));
			}

			socket.emit('sendText', paragraphs);
			console.log('sent on enter:', paragraphs);
			// prevent the default behaviour of return key pressed
			return false;
		}
		

		if (event.keyCode !== 16) {
			//console.log('here?', paragraphs);
			//var stringifiedPara = JSON.stringify(paragraphs);
			socket.emit('sendText', paragraphs);
		}
		var integer = 12;

		console.log('sent paragraphs:', paragraphs);
	};

	editor.addEventListener('keyup', this.keyUp, false);
	editor.addEventListener('click', this.setMarker, false);



	// coOp recived event
	socket.on('msgBroadcast', function (broadcastText) {
		//var broadcastText = JSON.parse(broadcastText);
		var para = editor.getElementsByTagName('p'),
			newParagraph;

		console.log('recieving from broadcast', broadcastText);
		
		// check for new paragraphs
		//console.log('length of broadcast:', broadcastText.data.length);
		//console.log('length of para:', para.length);

		if (broadcastText.data.length < paragraphs.data.length) { // if paragraph was deleted
			paragraphs.data = [];

			for (b = 0; b < broadcastText.data.length; b++) {
				paragraphs.data.push({ text: broadcastText.data[b].text, lock: '', id: broadcastText.data[b].id });
			}

			console.log('after delete:', paragraphs);

		} else {
			

			for (var b = 0; b < broadcastText.data.length; b++) {
				if (para[b] === undefined) { // last line
					newParagraph = document.createElement('p');
					
					console.log('new last line');
					newParagraph.id = broadcastText.data[b].id;
					newParagraph.className = 'lastLine';

					editor.appendChild(newParagraph);

					paragraphs.data.splice(b, 0, { text: broadcastText.data[b].text, lock: broadcastText.data[b].lock, id: broadcastText.data[b].id });
				} else if (broadcastText.data[b].id === parseInt(para[b].id)) {
					console.log('same line, update text if not locked');
					if (paragraphs.data[b].lock !== userId) {
						console.log('inside unlocked', userId);
						paragraphs.data[b].text = broadcastText.data[b].text;
						paragraphs.data[b].lock = broadcastText.data[b].lock;
						//paragraphs.data[b].id = broadcastText.data[b].id;
					} else {
						console.log('locked on user id:', paragraphs.data[b].lock);
					}
				} else {
					console.log('aha! new line here insertBefore');

					newParagraph = document.createElement('p');

					newParagraph.id = broadcastText.data[b].id;
					newParagraph.className = 'yolo swag';

					editor.insertBefore(newParagraph, para[b]);
					
					paragraphs.data.splice(b, 0, { text: broadcastText.data[b].text, lock: broadcastText.data[b].lock, id: broadcastText.data[b].id });
				}			
			}
		}

		console.log('paragraphs after first loop', paragraphs);

		var newPara = editor.getElementsByTagName('p');

		// insert changes

		if (paragraphs.data.length < newPara.length) { // if paragraph was deleted
			var newP;
			var currentPos;
			var range = document.createRange();


			if (window.getSelection().rangeCount > 0) {
				currentPos = this.findPosition(window.getSelection().getRangeAt(0).startContainer);
			} else {
				currentPos = {
					row: 0,
					col: 0
				};
			}
			
			//currentCol = window.getSelection().getRangeAt(0).startOffset;
			console.log('paragraph deleted, inserting new paras', paragraphs);
			console.log('current caret pos:', currentPos);

			editor.innerHTML = '';

			for (var n = 0; n < paragraphs.data.length; n++) {
				newP = document.createElement('p');

				newP.innerHTML = paragraphs.data[n].text;
				newP.id = paragraphs.data[n].id;

				editor.appendChild(newP);
			}

			that.setCaret(currentPos);

		} else {
			for (var n = 0; n < newPara.length; n++) {
				//console.log('new paragraphs lock:', paragraphs.data[n].lock);
				if (paragraphs.data[n].lock !== userId) {
					if (paragraphs.data[n].text === '') {
						newPara[n].innerHTML = '&nbsp;';
					} else {
						newPara[n].innerHTML = paragraphs.data[n].text;
					}						
				}
			}
		}
	});
};