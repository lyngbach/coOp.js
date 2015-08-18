// coOp.js v0.2
//
// keyCode 8 === backspace
// keyCode 46 === delete (both of them)	
// keyCode 16 === shift (both of them)	
// keyCode 13 === enter

var coOp = function (targetEditor, options) {
	'use strict';

	options = options || {};

	var editor,
		nullCounter = 0,
		type = options.type || 'noType',
		typeId = options.typeId || 'noTypeId',
		userId = options.userId || 'user_' + new Date().getSeconds() + '_' + Math.floor(Math.random() * (2000000 - 0)) + 0,
		userColor = options.userColor || 'userColor1',
		locked = false,
		lastParagraph,
		enterSplit,
		updateInterval,
		newLines = [],
		deletedLines = [],
		allSelected = [],
		paragraphs = {
			editor: targetEditor,
			data: []
		};

	var initCoOp = function () {
		socket.emit('coOpJoin', targetEditor, function () {
			var p;
			console.log('done joining room: ', targetEditor);

			console.log('co-op init editor med options:', options);

			if (options.data !== undefined) {
				editor.innerHTML = '';
				for (var d = 0; d < options.data.length; d++) {
					p = document.createElement('p');

					p.id = options.data[d].id;
					p.innerHTML = options.data[d].text;
					editor.appendChild(p);

					paragraphs.data.push({ text: options.data[d].text, lock: options.data[d].lock, id: options.data[d].id });
				}
			} else {
				var time = new Date().getTime() + '_' + Math.floor(Math.random() * (2000000 - 0)) + 0;

				p = document.createElement('p');

				p.id = time;
				p.innerHTML = '&nbsp;';

				paragraphs.data.push({ text: '&nbsp;', lock: '', id: time });

				editor.appendChild(p);
			}


			var fixFunc = function (event) {
				event = event || window.event;		
				event.stopPropagation();
			};

			editor.addEventListener('click', fixFunc);
			editor.addEventListener('mousedown', fixFunc);
			editor.addEventListener('touchstart', fixFunc);
			editor.addEventListener('MSPointerDown', fixFunc);
			editor.addEventListener('pointerdown', fixFunc);

			// making text area visible & editable
			editor.contentEditable = true;
			editor.classList.remove('faded');
			editor.blur();

			// Move caret/marker to specific position
			var setCaret = function (target, coloumn) {
				var targetNode = document.getElementById(target).firstChild,
					range = document.createRange(),
					sel = window.getSelection();

				if (coloumn > targetNode.length) {
					coloumn = targetNode.length;
				}

				console.log('setCaret targetNode', targetNode);

				range.setStart(targetNode, coloumn);
				range.setEnd(targetNode, coloumn);

				sel.removeAllRanges();
				sel.addRange(range);
			};


			// set marker on user click
			var setMarker = function () {
				setColorAndLock(function () {
					socket.emit('coOpText', paragraphs, options);
					console.log('sent on userclick', paragraphs);
				});	
			};


			var setColorAndLock = function (callback) {
				var paragraph = editor.getElementsByTagName('p'),
					activeUsers = usersOnline.querySelectorAll('[data-userId]'),
					currentActiveId,
					stillActive;

				if (window.getSelection().anchorNode !== null) {
					currentActiveId = window.getSelection().anchorNode.parentNode.id;
					//console.log('-->',currentActiveId);
					
					if(window.getSelection().anchorNode.parentNode.tagName === 'DIV'){
						currentActiveId = window.getSelection().anchorNode.id;
					}
				}

				// remove users lock/color
				for (var p = 0; p < paragraph.length; p++) {
					for (var d = 0; d < paragraphs.data.length; d++) {
						if (paragraph[p].id === paragraphs.data[d].id) {

							if (paragraph[p].id === currentActiveId && (paragraphs.data[d].lock === '' || paragraphs.data[d].lock === userId)) { // if active userId field
								paragraphs.data[d].lock = userId;

								for (var a = 0; a < activeUsers.length; a++) {
									if (activeUsers[a].getAttribute('data-userId') === paragraphs.data[d].lock) {
										document.getElementById(paragraphs.data[d].id).className = activeUsers[a].getAttribute('data-userColor');
									}
								}

							} else if (paragraphs.data[d].lock === userId && paragraph[p].id !== currentActiveId) { // remove old userId locks
								document.getElementById(paragraphs.data[d].id).className = 'newLine';
								paragraphs.data[d].lock = '';

							} else if (paragraphs.data[d].lock !== userId && paragraphs.data[d].lock !== '') { // if locked by someone else
								console.log('locked by userId:', paragraphs.data[d].lock);
								//console.log('para data', paragraphs.data[d], ' er locked af:', paragraphs.data[d].lock);
								stillActive = false;
								for (var b = 0; b < activeUsers.length; b++) {
									if (activeUsers[b].getAttribute('data-userId') === paragraphs.data[d].lock) {
										stillActive = true;
										//console.log('her med', paragraphs.data[d].lock);
										document.getElementById(paragraphs.data[d].id).className = activeUsers[b].getAttribute('data-userColor');

										if (paragraphs.data[d].id === currentActiveId) { // if on the active field
											document.getElementById(paragraphs.data[d].id).classList.add('userLocked');
										}
									}
								}

								if (stillActive === false) {
									console.log('==> Brugeren med id', paragraphs.data[d].lock,' er der ikke mere, unlock til den nue bruger');
									
									if (paragraphs.data[d].id === currentActiveId) { // if on the active field
										console.log('==> Overskriver gammel lock');
										paragraphs.data[d].lock = userId;

										for (var a = 0; a < activeUsers.length; a++) {
											if (activeUsers[a].getAttribute('data-userId') === paragraphs.data[d].lock) {
												document.getElementById(paragraphs.data[d].id).className = activeUsers[a].getAttribute('data-userColor');
											}
										}
									} else {
										paragraphs.data[d].lock = '';	
									}
								}
							} else {

								var clearTarget = document.getElementById(paragraphs.data[d].id);
								if (clearTarget !== null) {
									clearTarget.className = '';								
								}

							}
						}
					}
				}

				// check if a function or object
				//function isFunction(functionToCheck) {
				//	var getType = {};
				//	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
				//}

				if (callback !== undefined) {
					callback();
				}
			};


			var getMarkedElements = function () {
				var selection = window.getSelection(),
					selectionStart = selection.getRangeAt(0).startContainer.parentNode,
					start = false,
					selectionEnd = selection.getRangeAt(0).endContainer.parentNode,
					end = false,
					elements = editor.getElementsByTagName('p');

				allSelected = [];

				if (selection.toString() !== '') { // check if something is selected
					/*var allWithinRangeParent = editor.getElementsByTagName('p');

					for (var i = 0; i < allWithinRangeParent.length; i++) {
						console.log('selection check:', selection.getRangeAt(0));
						if (selection.containsNode(allWithinRangeParent[i], true)) {
							console.log('added to array:', allWithinRangeParent[i]);
							allSelected.push(allWithinRangeParent[i]);
						}
					}*/

					for (var i = 0; i < elements.length; i++) {
						//console.log('checker hvis in range', elements[i].id);
						//console.log('selectionStart ele', selectionStart);
						if (elements[i].id === selectionStart.id) {
							console.log('fandt start element:', selectionStart);
							start = true;
						}

						if (start === true && end !== true) {
							console.log('imellem selected stuff med element:', elements[i]);
							allSelected.push(elements[i]);
						}

						if (elements[i].id === selectionEnd.id) {
							console.log('fandt slut element:', selectionEnd);
							end = true;
						}



					}
				}
				console.log('return all selected:', allSelected);
				return allSelected;
			};


			var keyDown = function (event) {
				var markedElements = getMarkedElements(),
					target,
					selection,
					range,
					prevLocked;

				locked = false; // reset to default on keydown
				enterSplit = false;

				for (var m = 0; m < markedElements.length; m++) {
					selection = window.getSelection();
					range = selection.getRangeAt(0);

					if (range.endOffset < markedElements[m].innerHTML.length) {
						lastParagraph = false;
					} else {
						lastParagraph = true;
					}

					for (var p = 0; p < paragraphs.data.length; p++) {
						if (paragraphs.data[p].id === markedElements[m].id) {
							if (paragraphs.data[p].lock !== '' && paragraphs.data[p].lock !== userId) {
								console.log('LOCKED - preventing default');
								locked = true;
								event.preventDefault();
							}
						}
					}
				}


				if (event.keyCode === 8) { // handle backspace if one character left on line
					target = window.getSelection().anchorNode.parentNode;
					selection = window.getSelection();
					range = selection.getRangeAt(0);				
					
					if(target.tagName === 'DIV'){
						target = window.getSelection().anchorNode;
					}
					
					console.log('keyDown target', target);
					if (range.startOffset === 0) {
						prevLocked = '';

						// check if previous
						for (var l = 0; l < paragraphs.data.length; l++) {
							console.log('looping through paragraphs data', paragraphs.data[l]);
							if (paragraphs.data[l].id === target.id) {
								prevLocked = paragraphs.data[(l - 1)].lock;
							}
						}

						if (prevLocked !== '' && prevLocked !== userId) {
							event.preventDefault();
						} else {
							deletedLines.push(target.id);
							cleanDeleted(target.id);
							console.log('Deleted lines',deletedLines);
						}
					}

//					if (target.innerHTML.length < 2) {
//						event.preventDefault();
//
//						target.innerHTML = '<br>';
//
//						for (var u = 0; u < paragraphs.data.length; u++) {
//							if (paragraphs.data[u].id === target.id) {
//								paragraphs.data[u].text = target.innerHTML;
//							}
//						}
//					}
				}

				if (event.keyCode === 46) { // if delete
					target = window.getSelection().anchorNode.parentNode;
					range = window.getSelection().getRangeAt(0);

					if (window.getSelection().anchorNode.nodeType === 1) {
						target = window.getSelection().anchorNode;
					}

					//console.log('range startOffset:', range.startOffset);
					//console.log('target innerHTML length:', target.innerHTML);
					// check if next line is locked by someone else
					if (range.startOffset === target.innerHTML.length) {
						console.log('sidst på linjen, tjek next line');

						for (var n = 0; n < paragraphs.data.length; n++) {
							if (paragraphs.data[n].id === target.id) {
								if (paragraphs.data[(n + 1)] !== undefined) { // check for if delete is pressed at end of last line
									if (paragraphs.data[(n + 1)].lock !== '' && paragraphs.data[(n + 1)].lock !== userId) {
										console.log('næste linjen er locked, preventing default');
										event.preventDefault();
									}
								}
							}
						}
					}

					if (target.innerHTML === '&nbsp;') { // remove paragraphs if only white space remains
						for (var f = 0; f < paragraphs.data.length; f++) {
							if (paragraphs.data[f].id === target.id) {
								paragraphs.data.splice(f, 1);
							}
						}

						target.parentNode.removeChild(target);
						socket.emit('coOpText', paragraphs, options);
						event.preventDefault();
					}

					if (target.innerHTML.length === 1) { // if last character insert white space default
						target.innerHTML = '&nbsp;';
						event.preventDefault();
					}
				}

				if (event.keyCode !== 37 && event.keyCode !== 38 && event.keyCode !== 39 && event.keyCode !== 40) { // if anything by the arrow keys
					console.log('inside anything but arrow keys');
					target = window.getSelection().anchorNode.parentNode;
					range = window.getSelection().getRangeAt(0);

					for (var r = 0; r < paragraphs.data.length; r++) { // check if current row is locked by someone else
						if (paragraphs.data[r].id === target.id) {
							console.log('found paragraph', paragraphs.data[r].id);
							if (paragraphs.data[r].lock !== '' && paragraphs.data[r].lock !== userId) {
								if (event.keyCode !== 13 || (event.keyCode === 13 && range.startOffset !== target.textContent.length)) { // allow enter at end of locked line
									console.log('this is locked by someone, preventing default');
									event.preventDefault();
								}
							}
						}
					}
				}


				if (event.keyCode === 13) { // if enter split check
					target = window.getSelection().anchorNode.parentNode;
					range = window.getSelection().getRangeAt(0);

					console.log('enter target keydown', target);

					if (target.tagName === 'DIV') {
						console.log('var div, sætter ikke parentNode på¨anchorNode');
						target = window.getSelection().anchorNode;
					}

					console.log('--> Target inner HTML',target.innerHTML);

					if (range.startOffset < target.innerHTML.length && target.innerHTML !== '<br>') {
						console.log('enter split sættes til true!');
						enterSplit = true;
					}
				}
			};


			var keyUp = function (event) {
				// set color and lock
				setColorAndLock(function () {
					var paragraph = editor.getElementsByTagName('p'),
						updatedText,
						target,
						exist;

					if (event.shiftKey) {
						return false;
					}

					// if everything was deleted
					if (locked === false) { // if not locked
						if (paragraph.length === 0) {
							var newP = document.createElement('p'),
								newPTime = new Date().getTime() + '_' + Math.floor(Math.random() * (2000000 - 0)) + 0;

							newP.innerHTML = '&nbsp;';
							newP.id = newPTime;

							if (editor.childNodes[0] !== undefined) {
								if (editor.childNodes[0].nodeType === 1) { // remove if br tag
									editor.removeChild(editor.childNodes[0]);
								}
							}

							editor.appendChild(newP);
							paragraph = editor.getElementsByTagName('p');
							paragraphs.data = [{text: '&nbsp;', lock: '', id: newPTime}];

							socket.emit('coOpText', paragraphs, options);

							setCaret(newPTime, 0);

							return false;
						}

						if (paragraph.length < paragraphs.data.length && event.keyCode !== 13) { // if something was removed
							paragraph = editor.getElementsByTagName('p');
							target = window.getSelection().anchorNode;

							console.log('something was removed');

							console.log('target:', target);
							console.log('target tagName:', target.tagName);
							console.log('marked elements were:', allSelected);

							if (target.tagName === undefined) {
								target = window.getSelection().anchorNode.parentNode;
							}


							if (target.tagName === 'DIV' || target.tagName === undefined) {
								target = allSelected[0];

								console.log('chek',  document.getElementById(allSelected[0].id));

								if (document.getElementById(allSelected[0].id) === null) { // whole first marked paragraph deleted, wrap br around new p tag firefox/safari
									for (var f = editor.childNodes.length - 1; f >= 0; f--) {
										console.log('checking childNode', editor.childNodes[f], ' width nodeType:', editor.childNodes[f].nodeType);
										if (editor.childNodes[f].tagName === 'BR' || editor.childNodes[f].nodeType === 3) { // if br tagname or nodetype3 for textnode
											console.log('whats inside:', editor.childNodes[f].textContent);
											var wrapP = document.createElement('p'),
												wrapPTime = new Date().getTime() + '_' + Math.floor(Math.random() * (2000000 - 0)) + 0,
												oldBr = editor.childNodes[f],
												prevReference,
												coloumnPos = 0;

											wrapP.id = wrapPTime;

											if (editor.childNodes[f].textContent === '') {
												wrapP.innerHTML = '&nbsp;';
											} else {
												wrapP.innerHTML = editor.childNodes[f].textContent;
												coloumnPos = editor.childNodes[f].textContent.length;
												console.log('coloumnPos', coloumnPos);
											}

											console.log('new p created, wrapping element:', oldBr);

											editor.insertBefore(wrapP, oldBr);
											oldBr.parentNode.removeChild(oldBr);


											console.log('wrapped, time to find previous element of this new id:', wrapPTime);

											var paragraph = editor.getElementsByTagName('p');

											for (var l = 0; l < paragraph.length; l++) {
												if (paragraph[l].id === wrapPTime) {
													prevReference = paragraph[l].previousSibling;

													console.log('prevReference', prevReference);

													// find and updated paragraps data
													for (var m = paragraphs.data.length - 1; m >= 0; m--) {
														if (paragraphs.data[m].id === prevReference.id) {
															console.log('found prev node in data obj, inserting after');
															paragraphs.data.splice((m + 1), 0, { text: wrapP.innerHTML, lock: userId, id: wrapPTime });
															setCaret(wrapPTime, coloumnPos);
														}
													}
												}

											}
										}
									}
								}
							}

							console.log('target nodeType', target.nodeType);
							if (target.nodeType === 3) {
								target = window.getSelection().anchorNode.parentNode;
							}


							for (var o = paragraphs.data.length - 1; o >= 0; o--) {
								exist = false;

								for (var n = 0; n < paragraph.length; n++) {
									if (paragraph[n].id === paragraphs.data[o].id) {
										exist = true;
									}
								}

								if (exist === false) { // findes
									//console.log('exist.. splicing away', paragraphs.data[o]);

									if (event.keyCode === 8) { // if backspace only delete
										paragraphs.data[(o - 1)].text += paragraphs.data[o].text;
										paragraphs.data[o].lock = userId;	
									} 

									paragraphs.data.splice(o, 1);
								} else if (paragraphs.data[o].id === target.id) {
									console.log('linje ', o, ' text:', target.innerHTML);
									updatedText = target.innerHTML.replace(/<\/?[^>]+(>|$)/g, '')

									//console.log('updatedText', updatedText);
									//console.log('backspace range', window.getSelection().getRangeAt(0).startOffset);
									var backspaceRange = window.getSelection().getRangeAt(0).startOffset;
									if (updatedText === '') { // if everything was deleted insert white space
										updatedText = '&nbsp;';
									}

									paragraphs.data[o].text = updatedText;
									paragraphs.data[o].lock = userId;
									document.getElementById(paragraphs.data[o].id).innerHTML = updatedText;

									console.log('backspaceRange', backspaceRange);
									if (updatedText === '&nbsp;') {
										setCaret(paragraphs.data[o].id, 0);
									} else {
										setCaret(paragraphs.data[o].id, backspaceRange);
									}

									// trim parent div for br tags
									console.log('trim br tags:', editor.childNodes);
									for (var b = 0; b < editor.childNodes.length; b++) {
										if (editor.childNodes[b].tagName === 'BR') {
											console.log('removing br tag');
											editor.childNodes[b].parentNode.removeChild(editor.childNodes[b]);
										}
									}
								}
							}

							console.log('after character delete', paragraphs);
							socket.emit('coOpText', paragraphs, options);

							return false;
						}

						if (event.keyCode !== 13) { // if not enter
							target = window.getSelection().anchorNode.parentNode;
							paragraph = editor.getElementsByTagName('p');

							if (target.tagName === 'DIV') {
								target = window.getSelection().anchorNode;
							}


							console.log('find id:', target);
							console.log('target childNode', target.tagName);

							if (target.childNodes[0].tagName === 'BR' && target.innerHTML.length > 4) {
								console.log('removing br element');
								target.childNodes[0].parentNode.removeChild(target.childNodes[0]);
							}
							
							if(target.tagName === 'SPAN'){
								target = target.parentNode;
								console.log('Before regex', target.innerHTML);
								target.innerHTML = target.innerHTML.replace(/<\/?span[^>]*>/g,"");
								console.log('After', target.innerHTML);
							}
							
							/*for (var b = 0; b < editor.childNodes.length; b++) {
								if (editor.childNodes[b].tagName === 'BR') {
									console.log('removing br tag');
									editor.childNodes[b].parentNode.removeChild(editor.childNodes[b]);
								}
							}*/

							for (var p = 0; p < paragraphs.data.length; p++) {
								if (paragraphs.data[p].id === target.id) {
									if (paragraphs.data[p].lock === '' || paragraphs.data[p].lock === userId) {
										paragraphs.data[p].text = target.innerHTML;
										paragraphs.data[p].lock = userId;

										if (!window.getSelection().getRangeAt(0).startContainer.parentNode.classList.contains('editor')) {
											window.getSelection().getRangeAt(0).startContainer.parentNode.className = userColor;
										}
									} else {
										document.getElementById(paragraphs.data[p].id).innerHTML = paragraphs.data[p].text;
										console.log('text is locked!');
									}

									// if active paragraph is locked by someone else move caret to end of line
									if (paragraphs.data[p].lock !== '' && paragraphs.data[p].lock !== userId && paragraphs.data[p].id === target.id) {
										console.log('denne linje er aktiv men låst, move caret til end of line');
										setCaret(paragraphs.data[p].id, paragraphs.data[p].text.length);
									}
								}
							}

							if (event.keyCode !== 16) { // if not shift
								socket.emit('coOpText', paragraphs, options);
								console.log('sent paragraphs on keyup:', paragraphs);
							}

							return false;		
						}


						if (event.keyCode === 13) { // if enter
							console.log('inside enter stuff');
							var time = new Date().getTime() + '_' + Math.floor(Math.random() * (2000000 - 0)) + 0,
								activeUsers = usersOnline.querySelectorAll('[data-userId]'),
								range = window.getSelection().getRangeAt(0),
								previousLine,
								target;

							paragraph = editor.getElementsByTagName('p');

							//console.log('target:', window.getSelection().anchorNode);
							//console.log('RANGE', range);
							console.log('checj if split:', enterSplit);
							if (enterSplit === false) { // if new fresh line
								target = window.getSelection().anchorNode;
								//target.innerHTML = 'new_line&#10;';

								console.log('inside fresh line', target);
								console.log('inside fresh line tagName', target.tagName);

								if (target.tagName === undefined) { // if selecting on textNode
									target = window.getSelection().anchorNode.parentNode;
									console.log('new target because of textNode select', target);
								}

								previousLine = target.previousSibling;
								console.log('###', target.innerHTML);
								if(target.innerHTML === ''){
									console.log('er inde');
									target.innerHTML = '<br>';
								}

								// set user color for the new line
								for (var a = 0; a < activeUsers.length; a++) {
									if (activeUsers[a].getAttribute('data-userId') === userId) {
										target.className = activeUsers[a].getAttribute('data-userColor');
									}
								}
							} else { // if split
								target = window.getSelection().anchorNode.parentNode;
								
								if (target.classList.contains('editor') === true) {
									target = window.getSelection().anchorNode;								
								}
								
								console.log('inside split target', window.getSelection().getRangeAt(0));
								console.log('split nodeType', target.nodeType);

								if (target.previousSibling === null) {
									console.log('inside previousSibling null <!----');
									previousLine = target.parentNode.previousSibling;
									target.parentNode.innerHTML = target.parentNode.innerHTML.replace(/<\/?[^>]+(>|$)/g, '');
									if (target.parentNode.innerHTML === '') {
										target.parentNode.innerHTML = '<br>';
									}
								} else {
									previousLine = target.previousSibling;
								}
								
								if (target.innerHTML === '') {
									console.log('er inde');
									target.innerHTML = '<br>';
								}
							}
							
							for(var i = 0; i < paragraphs.data.length; i++){
								if(paragraphs.data[i].id === target.id){
									console.log(' window.getSelection().getRangeAt(0).startOffset', window.getSelection().getRangeAt(0).startOffset);
									console.log('paragraphs.data[i].text.length',paragraphs.data[i].text.length);
									console.log('paragraphs.data[i].text.length',document.getElementById(paragraphs.data[i].id).textContent.length);
									
									if(paragraphs.data[i].lock === '' || paragraphs.data[i].lock === userId || window.getSelection().getRangeAt(0).startOffset === 0){
										console.log('Assigning new id');
										target.id = time;
									}
								}
							}
							
							//Firefox id
							if(target.id === ''){
								console.log('FF: Assigning new id');
								target.id = time;
							}
							//target.setAttribute('data-newLine', true);

							newLines.push(time);



							console.log('previousLine', previousLine);

							for (var i = paragraphs.data.length - 1; i >= 0; i--) {
								//console.log('para data:', paragraphs.data[i].text);
								if (paragraphs.data[i].id === previousLine.id) {
									console.log('LOCK',paragraphs.data[i].lock);
									console.log('fandt previous line id og insætter previous text i data index:', i);
									paragraphs.data[i].text = previousLine.innerHTML;
									console.log('indsætter den ny linje med texten:', target.innerHTML);
									paragraphs.data.splice((i + 1), 0, { text: target.innerHTML, lock: userId, id: time });
								}
							}

							// check if something is deleted
							paragraph = editor.getElementsByTagName('p');
							for (var d = paragraphs.data.length - 1; d >= 0; d--) {
								exist = false;

								for (var e = 0; e < paragraph.length; e++) {
									if (paragraph[e].id === paragraphs.data[d].id) {
										exist = true;
									}
								}

								if (exist === false) { // findes ikke
									console.log(paragraphs.data[d], ' fandtes ikke, sletter fra para data');
									paragraphs.data.splice(d, 1);
								}							
							}

							console.log('enter after paragraphs data splice:', paragraphs);
							console.log('ENTER: emitting options', options);
							//setCaret(target.id, 0);		
							socket.emit('coOpText', paragraphs, options);

							return false;
						}
					}
				});

				clearTimeout(updateInterval);

				updateInterval = setTimeout(function () {
					console.log('update to broadcast with plan room', options.planRoom);
					socket.emit('coOpUpdate', options.planRoom);
				}, 1000);
			};

			// handling events

			var editors = document.getElementsByClassName('editor');
			
			for(var e = 0; e < editors.length; e++){
				editors[e].removeEventListener('keydown', keyDown, false);
				editors[e].removeEventListener('keyup', keyUp, false);
				editors[e].removeEventListener('click', setMarker, false);
			}

			// remove lock on blur
			document.getElementById(targetEditor).onblur = function () {
				for (var p = 0; p < paragraphs.data.length; p++) {
					if (paragraphs.data[p].lock === options.userId) {
						paragraphs.data[p].lock = '';
					}
				}
				editor.removeEventListener('keydown', keyDown, false);
				editor.removeEventListener('keyup', keyUp, false);
				editor.removeEventListener('click', setMarker, false);
			};
			
			document.getElementById(targetEditor).onfocus = function () {
				editor.addEventListener('keydown', keyDown, false);
				editor.addEventListener('keyup', keyUp, false);
				editor.addEventListener('click', setMarker, false);
			};

			// coOp recived event
			socket.on('msgBroadcast', function (broadcastText) {
				var broadcastIds = [],
					target,
					editor = document.getElementById(broadcastText.editor),
					newLine = false;

				if (window.getSelection().anchorNode !== null) {
					target = window.getSelection().anchorNode.parentNode;
				}

				console.log('recieving from broadcast', broadcastText);
				//console.log('broadcast editor', editor);

				for (var b = 0; b < broadcastText.data.length; b++) {
					broadcastIds.push(broadcastText.data[b].id);

					var currentPara = document.getElementById(broadcastText.data[b].id);
					console.log('currentPara', currentPara, ' is locked to:', broadcastText.data[b].lock);
					if (currentPara === null && broadcastText.data[b].lock !== userId) { // if the element doesnt exist on client yet and isent locked ot the client user
						console.log('new line on client side');

						var newP = document.createElement('p');

						newP.id = broadcastText.data[b].id;
						newP.innerHTML = broadcastText.data[b].text;

						newLines.push(broadcastText.data[b].id);
						//console.log('current b', b);
						//console.log('paragraphs length:', paragraphs.data.length);
						//console.log('broadcast editor:', broadcastText.editor);
						//console.log('editor', editor);
						
						if(deletedLines.indexOf(broadcastText.data[b].id) === -1){
							if (b === paragraphs.data.length) { // on last line on client textarea
								console.log('appender p tag');
								editor.appendChild(newP);

								paragraphs.data.push({ text: broadcastText.data[b].text, lock: broadcastText.data[b].lock, id: broadcastText.data[b].id });
							} else {
								console.log('inserting new p tag before index', (b + 1));
								var targetIndex = 0,
									targetId;

								if (broadcastText.data[(b + 1)] === undefined) { // if new line is the last in data obj before deletions
									editor.appendChild(newP);
								} else {
									targetId = broadcastText.data[(b + 1)].id;
									editor.insertBefore(newP, document.getElementById(targetId));	
								}

								for (var p = 0; p < paragraphs.data.length; p++) {
									if (paragraphs.data[p].id === targetId) {
										console.log('inserting new middle line into paragraphs data object', p);
										targetIndex = p;
									}
								}

								paragraphs.data.splice(targetIndex, 0, { text: broadcastText.data[b].text, lock: broadcastText.data[b].lock, id: broadcastText.data[b].id });
							}
						}

					} else { // if existing line
						//console.log('existing line', currentPara);
						if (broadcastText.data[b].lock !== userId) { // if not the user's paragraph

							currentPara.innerHTML = broadcastText.data[b].text;

							for (var u = 0; u < paragraphs.data.length; u++) {
								if (paragraphs.data[u].id === broadcastText.data[b].id) {

									paragraphs.data[u].text = broadcastText.data[b].text;
									paragraphs.data[u].lock = broadcastText.data[b].lock;

									if (target !== undefined) { // handling if co-op field is not selected
										if (paragraphs.data[u].id === target.id) { // if on the users active line
											console.log('user is active on locked line, placing caret at end of line');
											setCaret(target.id, currentPara.innerHTML.length);
										}	
									}

								}
							}

						} else {
							for (var q = 0; q < paragraphs.data.length; q++) { // if the user's paragraph

								if (paragraphs.data[q].id === broadcastText.data[b].id) {
									paragraphs.data[q].lock = broadcastText.data[b].lock;
								}
							}
						}
					}
				}

				//console.log('før det går galt', editor);
				console.log('after recieved loop:', paragraphs);

				// delete old dom p elements
				var paragraph = editor.getElementsByTagName('p');

				//console.log('deleting outdated elements if not inside:', broadcastIds);

				for (var d = paragraph.length - 1; d >= 0; d--) {
					//console.log('checking element', paragraph[d], ' === ', broadcastIds.indexOf(paragraph[d].id));
					//console.log('checking for data-newLine attribute i array:', paragraph[d].id);
					//if (broadcastIds.indexOf(paragraph[d].id) < 0 && paragraph[d].getAttribute('data-newLine') !== 'true') {
					var para = paragraph[d];

					if (broadcastIds.indexOf(para.id) < 0 && newLines.indexOf(para.id) < 0) {


						for (var c = paragraphs.data.length - 1; c >= 0; c--) {
							if (paragraphs.data[c].id === para.id) {
								console.log('sletter:', para, ' width id:', para.id);

								paragraphs.data.splice(c, 1);
								para.parentNode.removeChild(para);
							}
						}


					}

					//if (paragraph[d].getAttribute('data-newLine') === 'true') {
					if (para !== undefined) {
						if (newLines.indexOf(para.id) > -1) {
							cleanTarget(para.id);
						}	
					}

				}

				/*for (var d = paragraphs.data.length - 1; d >= 0; d--) {

					if (broadcastIds.indexOf(paragraphs.data[d].id) < 0) {
						var target = document.getElementById(paragraphs.data[d].id);

						if (target.classList.contains('newLine') === true) {
							console.log('sletter ikke dette nye element og fjerner newLine class', target);
							target.classList.remove('newLine');
						} else {
							console.log('sletter:', target, ' width id:', target.id);
							target.parentNode.removeChild(target);
							paragraphs.data.splice(d, 1);
						}

					}
				}*/

				setColorAndLock();

				//console.log('paragraphs after delete:', paragraphs);
			});
		});
	};

	function cleanTarget(paraId) {
		setTimeout(function () {
			//paragraph.removeAttribute('data-newLine');

			for (var i = newLines.length - 1; i >= 0; i--) {
				if (paraId === newLines[i]) {
					newLines.splice(i, 1);
					console.log('cleaning', paraId, ' newline from array', newLines);
				}
			};
		}, 4000);
	}
	
	function cleanDeleted(paraId) {
		setTimeout(function () {
			//paragraph.removeAttribute('data-newLine');

			for (var i = deletedLines.length - 1; i >= 0; i--) {
				if (paraId === deletedLines[i]) {
					deletedLines.splice(i, 1);
					console.log('cleaning', paraId, ' deleted line from array', deletedLines);
				}
			};
		}, 4000);
	}


	// check for target is null 5 times x6
	var checkForNull = function () {
		editor = document.getElementById(targetEditor);

		if (editor === null && nullCounter < 6) {
			nullCounter++;
			//console.log('was null going for the ' + nullCounter + '. time');
			setTimeout(checkForNull, 200);
		} else if (editor === null && nullCounter === 6) {
			console.error('coOp couldnt not init textfield with the id:', targetEditor);
		} else if (editor !== null) {			
			initCoOp();
		}
	};
	checkForNull();
};