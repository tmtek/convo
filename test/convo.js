let { Convo } = require('../src/convo');
let assert = require('assert');

describe('Convo', () => {

	describe('#mockConv', () => {
		it('Should give us a conv mock object with the basic required elements.', () => {
			let { surface, available, user, contexts } = Convo.mockConv();
			assert(
				surface &&
				surface.capabilities &&
				available &&
				available.surfaces &&
				available.surfaces.capabilities &&
				user &&
				user.access &&
				user.storage &&
				contexts,
				'Missing essential members.'
			);
		});
		it('Should be able to populate using the argument', () => {
			let mockConv = Convo.mockConv(conv =>
				conv.user.storage = { testVal: 'test' }
			);
			assert(
				mockConv.user.storage.testVal && mockConv.user.storage.testVal === 'test',
				'Missing essential members.'
			);
		});
	});

	describe('#setClassMappings', () => {
		it('Should wrap data when class mappings are not set.', () => {
			let contents = { id: 'test' };
			assert(Convo.SignIn(contents).data.id ==='test');
			assert(Convo.SimpleResponse(contents).data.id ==='test');
			assert(Convo.Button(contents).data.id ==='test');
			assert(Convo.NewSurface(contents).data.id ==='test');
			assert(Convo.Image(contents).data.id ==='test');
			assert(Convo.List(contents).data.id ==='test');
			assert(Convo.BasicCard(contents).data.id ==='test');
		});
		it('Should allow set class mappings to override defaults', () => {
			let contents = { id: 'test' };
			let mapFunc = data => data;
			Convo.setClassMappings({
				SignIn: mapFunc,
				SimpleResponse: mapFunc,
				Button: mapFunc,
				NewSurface: mapFunc,
				Image: mapFunc,
				List: mapFunc,
				BasicCard: mapFunc
			});
			assert(Convo.SignIn(contents).id ==='test');
			assert(Convo.SimpleResponse(contents).id ==='test');
			assert(Convo.Button(contents).id ==='test');
			assert(Convo.NewSurface(contents).id ==='test');
			assert(Convo.Image(contents).id ==='test');
			assert(Convo.List(contents).id ==='test');
			assert(Convo.BasicCard(contents).id ==='test');
			Convo.setClassMappings(null);
		});
	});

	describe('#constructor',() => {
		it('Should contain a default mock conv object when no argument is passed.', () => {
			let convo = new Convo();
			assert(convo.conv, 'No conv object found');
		});

		it('Should be able to pass a mock conv object as an argument', () => {
			let mockConv = Convo.mockConv();
			let convo = new Convo(mockConv);
			assert(convo.conv === mockConv, 'the conv object is not the same as the mockConv');
		});

		it('Should be able to pass another Convo object an use it\'s conv.', () => {
			let mockConv = Convo.mockConv();
			let convo = new Convo(mockConv);
			let newConvo = new Convo(convo);
			assert(newConvo.conv === mockConv, 'the copied conv object is not the same as the conv');
		});
	});

	describe('#write', () => {
		it('Should allow you to add a written only message', () => {
			let convo = new Convo().write(`Test Message`);
			assert(convo._write.length === 1, 'There should be one entry in _write');
			assert(convo._speak.length === 0, 'There should be no entries in _speak');
		});

		it('Should allow you to add a multiple written only messages', () => {
			let convo = new Convo()
				.write(`Test 1`)
				.write(`Test 2`)
				.write(`Test 3`);
			assert(convo._write.length === 3, 'There should be one entry in _write');
		});

		it('Should allow you to add a written message that is only added if there are no other written text', () => {
			let convo = new Convo().write(`Test 1`, true);
			assert(convo._write.length === 1, 'There should be one entry in _write because there were no previous entries');
			convo.write(`Test 2`, true);
			assert(convo._write.length === 1, 'There should be one entry in _write because there was already a message previously');
		});
	});

	describe('#hasWriting', () => {
		it('Should allow you to check if any written responses exist', () => {
			let convo = new Convo();
			assert(!convo.hasWriting(), 'Should return false');
			convo.write(`Test Message`);
			assert(convo.hasWriting(), 'Should return true');
		});
	});

	describe('#speak', () => {
		it('Should allow you to add a spoken message that also writes.', () => {
			let convo = new Convo().speak(`Test Message`);
			assert(convo._write.length === 1, 'There should be one entry in _write');
			assert(convo._speak.length === 1, 'There should be one entry in _speak');
		});

		it('Should allow you to add a spoken message that does not write.', () => {
			let convo = new Convo().speak(`Test Message`, false);
			assert(convo._write.length === 0, 'There should be no entries in _write');
			assert(convo._speak.length === 1, 'There should be one entry in _speak');
		});

		it('Should allow you to add multiple spoken messages.', () => {
			let convo = new Convo()
				.speak(`Test 1`)
				.speak(`Test 2`)
				.speak(`Test 3`);
			assert(convo._speak.length === 3, 'There should be 3 entries in _speak');
		});

	});

	describe('#present', () => {
		it('Should allow you to add a media message.', () => {
			let convo = new Convo().present({});
			assert(convo._rich.length === 1 , 'There should be one entry in _rich');
		});

		it('Should allow you to add multiple media messages.', () => {
			let convo = new Convo()
				.present({})
				.present({})
				.present({});
			assert(convo._rich.length === 3, 'There should be 3 entries in _rich');
		});

	});

	describe('#clear', () => {
		it('Should allow you to clear all existing responses.', () => {
			let convo = new Convo()
				.write('hi!')
				.speak('yo!')
				.present({});
			assert(
				convo._write.length > 0 &&
				convo._speak.length > 0 &&
				convo._rich.length > 0,
				'There should be entries in all response arrays'
			);
			convo.clear();
			assert(
				convo._write.length === 0 &&
				convo._speak.length === 0 &&
				convo._rich.length === 0 ,
				'There should be no entries in all response arrays'
			);
		});
	});

	describe('#promise', () => {
		it('Should always return a promise', () => {
			let convo = new Convo();
			assert(convo.promise().then ,'Not a promise returned.');
		});
		it('Should always enforce a Convo return', (done) => {
			let convo = new Convo();
			convo.promise()
				.then(c => {
					c === convo ? done() : done('Was not a Convo object.');
				});
		});
		it('Should error if I return something other than a convo', (done) => {
			let convo = new Convo();
			convo.promise(c => 'not a convo')
				.catch(error => done())
				.then(c => {
					c && done(new Error('Should have thrown an error because the returned type is not Convo'));
				});
		});
	});

	describe('#getAccessToken', () => {
		it('Should return null if no access token exists', () => {
			let convo = new Convo();
			assert(!convo.getAccessToken(), 'Should be no access token');
		});
		it('Should return token if access token exists in conv.', () => {
			let convo = new Convo(Convo.mockConv(conv => {
				conv.user.access.token = 'test';
			}));
			assert(convo.getAccessToken() === 'test', 'Should be an access token');
		});
	});

	describe('#hasAccessToken', () => {
		it('Should return false if no access token exists', () => {
			let convo = new Convo();
			assert(!convo.hasAccessToken(), 'Should be no access token');
		});
		it('Should true if access token exists in conv.', () => {
			let convo = new Convo(Convo.mockConv(conv => {
				conv.user.access.token = 'test';
			}));
			assert(convo.hasAccessToken(), 'Should be an access token');
		});
	});

	describe('#setAccessToken', () => {
		it('Should allow us to set a token', () => {
			let convo = new Convo().setAccessToken('test');
			assert(convo.getAccessToken() === 'test', 'Should be an access token');
		});
		it('Should change the token if access token exists in conv.', () => {
			let convo = new Convo(Convo.mockConv(conv => {
				conv.user.access.token = 'test';
			})).setAccessToken('test 2');
			assert(convo.getAccessToken() === 'test 2', 'Should be an access token');
		});
	});

	describe('#getContext', () => {
		it('Should throw error if called without context supplied.', () => {
			assert.throws(() => new Convo().getContext(),'An error was not thrown.');

		});
		it('Should return null if no context data exists.', () => {
			assert(!new Convo().getContext('test'),'Should have returned null.');
		});
		it('Should return static context data if it exists', () => {
			let mockConv = Convo.mockConv();
			mockConv.contexts.test = { lifespan: 1, parameters: { testVal: 'test' } };
			let convo = new Convo(mockConv);
			assert(
				convo.getContext('test').testVal && convo.getContext('test').testVal === 'test',
				'Context data did not match data in the conv object context.'
			);
		});
		it('Should return context.get() data if it exists', () => {
			let mockConv = Convo.mockConv();
			mockConv.contexts.get = name => name === 'test' ? { lifespan: 1, parameters: { testVal: 'test' } } : null;
			let convo = new Convo(mockConv);
			assert(
				convo.getContext('test').testVal && convo.getContext('test').testVal === 'test',
				'Context data did not match data in the conv object context.'
			);
		});
	});

	describe('#setContext', () => {
		it('Should be able to set contextual data then read it back.', () => {
			let convo = new Convo().setContext('test', 1, { testVal: 'test' });
			assert(
				convo.getContext('test').testVal && convo.getContext('test').testVal === 'test',
				'Read contextual data does not match up what we set.'
			);
		});
		it('Should be able to overwrite existing contextual data then read it back.', () => {
			let mockConv = Convo.mockConv();
			mockConv.contexts.test = { lifespan: 1, parameters: { testVal: 'test 1' } };
			let convo = new Convo(mockConv).setContext('test', 1, { testVal: 'test 2' });
			assert(
				convo.getContext('test').testVal && convo.getContext('test').testVal === 'test 2',
				'Read contextual data does not match up what we set.'
			);
		});
		it('Should be able to wipe a set context', () => {
			let convo = new Convo().setContext('test', 1, { testVal: 'test' });
			assert(
				convo.getContext('test').testVal && convo.getContext('test').testVal === 'test',
				'Read contextual data does not match up what we set.'
			);
			convo.setContext('test');
			assert(
				!convo.getContext('test'),
				`This should return null.`
			);
		});
	});

	describe('#getStorage', () => {
		it('Should return an empty object by default.', () => {
			assert(
				new Convo().getStorage(),
				'There should always be a default storage object.'
			);
		});
		it('Should return data from static storage data on the conv.', () => {
			let mockConv = Convo.mockConv();
			mockConv.user.storage = { testVal: 'test' };
			let convo = new Convo(mockConv);
			assert(
				convo.getStorage().testVal && convo.getStorage().testVal==='test',
				'The static data was not accesible'
			);
		});
	});

	describe('#setStorage', () => {
		it('Should be able to set data to storage and read it back.', () => {
			let convo = new Convo().setStorage({ testVal: 'test' });
			assert(
				convo.getStorage().testVal && convo.getStorage().testVal==='test',
				'The set data does not match what we found.'
			);
		});
		it('Should be able to override existing data', () => {
			let mockConv = Convo.mockConv();
			mockConv.user.storage = { testVal: 'test 1' };
			let convo = new Convo(mockConv);
			assert(
				convo.getStorage().testVal && convo.getStorage().testVal==='test 1',
				'The starting data does not match what we found.'
			);
			convo.setStorage({ testVal: 'test 2' });
			assert(
				convo.getStorage().testVal && convo.getStorage().testVal==='test 2',
				'The set data does not match what we found.'
			);
		});
		it('If null is sent as value, should reset the data', () => {
			let mockConv = Convo.mockConv();
			mockConv.user.storage = { testVal: 'test 1' };
			let convo = new Convo(mockConv);
			assert(
				convo.getStorage().testVal && convo.getStorage().testVal==='test 1',
				'The starting data does not match what we found.'
			);
			convo.setStorage();
			assert(
				convo.getStorage() && !convo.getStorage().testVal,
				'The set data does not match what we found.'
			);
		});
	});

	describe('#getFromStorage', () => {
		it('Should be able to get a piece of data set to storage', () => {
			let convo = new Convo().setToStorage('test', { testVal: 'test' });
			assert(
				convo.getFromStorage('test') && convo.getFromStorage('test').testVal === 'test',
				'The set data does not match what we found.'
			);
		});
		it('Should be able to get a piece of data form static storage', () => {
			let mockConv = Convo.mockConv();
			mockConv.user.storage = { test: { testVal: 'test' } };
			let convo = new Convo(mockConv);
			assert(
				convo.getFromStorage('test') && convo.getFromStorage('test').testVal === 'test',
				'The set data does not match what we found.'
			);
		});
	});

	describe('#setToStorage', () => {
		it('Should be able to set a piece of data to storage', () => {
			let convo = new Convo().setToStorage('test', { testVal: 'test' });
			assert(
				convo.getStorage().test && convo.getStorage().test.testVal === 'test',
				'The set data does not match what we found.'
			);
		});
		it('Should be able to wipe a piece of data in storage', () => {
			let convo = new Convo().setToStorage('test', { testVal: 'test' });
			assert(
				convo.getStorage().test && convo.getStorage().test.testVal === 'test',
				'The set data does not match what we found.'
			);
			convo.setToStorage('test', null);
			assert(
				!convo.getStorage().test,
				'The set data does not match what we found.'
			);
		});
	});

	describe('#isInStorage', () => {
		it('Should be able to check for an item set in storage.', () => {
			let convo = new Convo().setToStorage('test', { testVal: 'test' });
			assert(
				convo.isInStorage('test') && convo.isInStorage('test', data => data.testVal === 'test'),
				'The set data does not match what we found.'
			);
		});
		it('Should return false when item is not in storage.', () => {
			let convo = new Convo();
			assert(
				!convo.isInStorage('test') && !convo.isInStorage('test', data => data.testVal === 'test'),
				'The set data does not match what we found.'
			);
		});
	});

	describe('#onStorageUpdated', () => {
		it('Should call the method whenever data is set to storage.', (done) => {
			new Convo()
				.onStorageUpdated(storage => {
					if (storage.test && storage.test.testVal && storage.test.testVal === 'test') {
						done();
					}
					else {
						done(new Error('Data does not match what we set.'));
					}
				})
				.setToStorage('test', { testVal: 'test' });
		});
		it('Should not call update for initial data', (done) => {
			let mockConv = Convo.mockConv();
			mockConv.user.storage = { test: { testVal: 'test 1' } };
			new Convo(mockConv)
				.onStorageUpdated(storage => {
					if (storage.test && storage.test.testVal && storage.test.testVal === 'test 2') {
						done();
					}
					else {
						done(new Error('Data does not match what we set.'));
					}
				})
				.setToStorage('test', { testVal: 'test 2' });
		});
		it('Should transfer the storage method when copying Convos', (done) => {
			let convo1 = new Convo()
				.onStorageUpdated(storage => {
					if (storage.test && storage.test.testVal && storage.test.testVal === 'test') {
						done();
					}
					else {
						done(new Error('Data does not match what we set.'));
					}
				});

			new Convo(convo1)
				.setToStorage('test', { testVal: 'test' });
		});
	});

	describe('#ask', () => {
		it('Should return a promise', () => {
			assert(Convo.ask(new Convo()).then, 'Does not return a promise.');
		});
		it('Should throw error if not submitted a Convo', () => {
			assert.throws(() => Convo.ask({}));
		});
		it('Should resolve with a Convo object.', (done) => {
			Convo.ask(new Convo())
				.then(({ convo }) => {
					convo ? done() : done(new Error("Wasn't a Convo object."));
				});
		});
		it('Should contain an outgoing ask request', (done) => {
			Convo.ask(new Convo().speak('test'))
				.then(({ requests: [request] }) =>
					request && request.action === 'ask' ?
						done() : done(new Error(
							`The outgoing request is not an ask: \n\n${JSON.stringify(request, null, 2)}`
						))
				);
		});
	});

	describe('#close', () => {
		it('Should return a promise', () => {
			assert(Convo.close(new Convo()).then, 'Does not return a promise.');
		});
		it('Should throw error if not submitted a Convo', () => {
			assert.throws(() => Convo.close({}));
		});
		it('Should resolve with a Convo object.', (done) => {
			Convo.close(new Convo())
				.then(({ convo }) => {
					convo ? done() : done(new Error("Wasn't a Convo object."));
				});
		});
		it('Should contain an outgoing close request', (done) => {
			Convo.close(new Convo().speak('test'))
				.then(({ requests: [request] }) =>
					request && request.action === 'close' ?
						done() : done(new Error(
							`The outgoing request is not an close: \n\n${JSON.stringify(request, null, 2)}`
						))
				);
		});
	});

	describe('Conversational Request Examples', () => {
		it('Should output a SimpleResponse request for a phrase that contains identical text and speech.', (done) => {
			let phrase = 'test';
			Convo.close(new Convo()
				.speak(phrase)
			)
				.then(({ requests }) => {
					if (requests && requests.length === 1) {
						let { payload } = requests[0];
						if (
							payload.type === 'SimpleResponse' &&
							payload.data.text === phrase &&
							payload.data.speech === phrase
						) {
							done();
						}
						else {
							done(new Error(`Output is not what we expect: ${JSON.stringify(requests, null, 2)}`));
						}
					}
					else {
						done(new Error(`Didn't have the right amount of requests.${JSON.stringify(requests, null, 2)}`));
					}
				});
		});
		it('Should output a SimpleResponse request for multiple phrases that contain identical text and speech.', (done) => {
			let phrase1 = 'test 1';
			let phrase2 = 'test 2';
			let phrase3 = 'test 3';
			Convo.close(new Convo()
				.speak(phrase1)
				.speak(phrase2)
				.speak(phrase3)
			)
				.then(({ requests }) => {
					if (requests && requests.length === 1) {
						let { payload } = requests[0];
						if (
							payload.type === 'SimpleResponse' &&
							payload.data.text === `${phrase1} ${phrase2} ${phrase3}` &&
							payload.data.speech === `${phrase1} ${phrase2} ${phrase3}`
						) {
							done();
						}
						else {
							done(new Error(`Output is not what we expect: ${JSON.stringify(requests, null, 2)}`));
						}
					}
					else {
						done(new Error(`Didn't have the right amount of requests.${JSON.stringify(requests, null, 2)}`));
					}
				});
		});
		it('Should output a SimpleResponse request for a phrase that contains different text and speech.', (done) => {
			let phraseText = 'test text';
			let phraseSpeech = 'test speech';
			Convo.close(new Convo()
				.write(phraseText)
				.speak(phraseSpeech, false)
			)
				.then(({ requests }) => {
					if (requests && requests.length === 1) {
						let { payload } = requests[0];
						if (
							payload.type === 'SimpleResponse' &&
							payload.data.text === phraseText &&
							payload.data.speech === phraseSpeech
						) {
							done();
						}
						else {
							done(new Error(`Output is not what we expect: ${JSON.stringify(requests, null, 2)}`));
						}
					}
					else {
						done(new Error(`Didn't have the right amount of requests.${JSON.stringify(requests, null, 2)}`));
					}
				});
		});
		it('Should output a SimpleResponse and a Rich Response (List), but the SimpleResponse should always be the first sent.', (done) => {
			let phrase = 'test';
			Convo.close(new Convo()
				.present(Convo.List())
				.speak(phrase)
			)
				.then(({ requests }) => {
					if (requests && requests.length === 2) {
						let simpleResponse = requests[0];
						let mediaResponse = requests[1];
						if (
							simpleResponse.payload.type === 'SimpleResponse' &&
							simpleResponse.payload.data.text === phrase &&
							simpleResponse.payload.data.speech === phrase &&
							mediaResponse.payload.type === 'List'
						) {
							done();
						}
						else {
							done(new Error(`Output is not what we expect: ${JSON.stringify(requests, null, 2)}`));
						}
					}
					else {
						done(new Error(`Didn't have the right amount of requests.${JSON.stringify(requests, null, 2)}`));
					}
				});
		});
	});

	describe('#select', () => {
		it('Should select an item and report back on it.', () => {
			let convo = new Convo().select('thing', { value: 'the thing' });
			assert(convo.hasSelection());
			assert(convo.hasSelection('thing'));
			assert(convo.getSelection().item.value === 'the thing');
		});
		it('Should respond back negatively when there is no selection.', () => {
			let convo = new Convo();
			assert(!convo.hasSelection());
			assert(!convo.hasSelection('thing'));
			assert(convo.getSelection() === null);
		});
		it('Should be able to discriminate on types.', () => {
			let convo = new Convo().select('thing', { value: 'the thing' });
			assert(convo.hasSelection());
			assert(!convo.hasSelection('thing2'));
		});
		it('Should be able to clear selection.', () => {
			let convo = new Convo().select('thing', { value: 'the thing' });
			assert(convo.hasSelection());
			assert(convo.hasSelection('thing'));
			assert(convo.getSelection().item.value === 'the thing');
			convo.clearSelection();
			assert(!convo.hasSelection());
			assert(!convo.hasSelection('thing'));
			assert(convo.getSelection() === null);
		});
		it('Should be to present selection.', () => {
			let convo = new Convo().select('thing', { value: 'the thing' });
			convo.forSelection(({ type, item }) => {
				assert(type === 'thing');
				assert(item.value === 'the thing');
			});
		});
	});

	describe('#setList', () => {
		it('Should throw an error if a type or a list is not passed.', () => {
			assert.throws(() => new Convo().setList());
			assert.throws(() => new Convo().setList('items'));
		});
		it('Should allow a list to be set to be the current contextual list.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3']);
			assert(convo.getContext('list') && convo.getContext('list').list, 'List is not set into list context.');
			assert(convo.getContext('list').paging.start === 0 && convo.getContext('list').paging.count === -1, 'Default paging not what\'s expected.');
		});
		it('Should allow a contextual list to be overridden by another.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3']);
			assert(
				convo.getContext('list') && convo.getContext('list').list && convo.getContext('list').list.length === 3,
				'List is not set into list context.'
			);
			assert(convo.getContext('list').paging.start === 0 && convo.getContext('list').paging.count === -1, 'Default paging not what\'s expected.');
			convo.setList('items', ['thing 1', 'thing 2'], { start: 1, count: 1 });
			assert(
				convo.getContext('list') && convo.getContext('list').list && convo.getContext('list').list.length === 2,
				'List is not set into list context.'
			);
			assert(convo.getContext('list').paging.start === 1 && convo.getContext('list').paging.count === 1, 'Default paging not what\'s expected.');
		});
	});

	describe('#updateList', () => {
		it('Should throw an error if a list is not passed.', () => {
			assert.throws(() => new Convo().updateList());
		});
		it('Should throw an error if there is no contextual list.', () => {
			assert.throws(() => new Convo().updateList(['test 1', 'test 2']));
		});
		it('Should allow an existing contextual list to be updated.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3']);
			assert(
				convo.getContext('list') && convo.getContext('list').list && convo.getContext('list').list.length === 3,
				'List is not set into list context.'
			);
			convo.updateList(['thing 1', 'thing 2']);
			assert(
				convo.getContext('list') && convo.getContext('list').list && convo.getContext('list').list.length === 2,
				'List was no updated properly.'
			);
		});
	});

	describe('#clearList', () => {
		it('Should not throw an error if no contextual list exists.', () => {
			assert.doesNotThrow(() => new Convo().clearList());
		});
		it('Should clear a contextual list out of context.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3']);
			assert(
				convo.getContext('list') && convo.getContext('list').list && convo.getContext('list').list.length === 3,
				'List is not set into list context.'
			);
			convo.clearList();
			assert(
				!convo.getContext('list'),
				'List was not cleared properly.'
			);
		});
	});

	describe('#hasList', () => {
		it('Should return false if there is no contextual list.', () => {
			assert(!new Convo().hasList(), 'There shouldn\'t be a list right now');
		});
		it('Should return false if there is no contextual list and a supplied list type.', () => {
			assert(!new Convo().hasList('items'), 'There shouldn\'t be a list right now');
		});
		it('Should return true if there is a contextual list.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(convo.hasList(), 'There should be a list');
		});
		it('Should return true if there is a contextual list with the correct list type.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(convo.hasList('items'), 'There should be a list');
		});
		it('Should return false if there is a contextual list with an incorrect list type.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(!convo.hasList('notitems'), 'There should be a list');
		});
	});

	describe('#getList', () => {
		it('Should return null if there is no contextual list.', () => {
			assert(!new Convo().getList(), 'There shouldn\'t be a list right now');
		});
		it('Should return the list if there is a contextual list.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(
				convo.getList() && convo.getList().list && convo.getList().list.length === 3,
				'Did not get the correct list.'
			);
		});
	});

	describe('#updateListPaging', () => {
		it('Should throw an error if there is no contextual list.', () => {
			assert.throws(() => new Convo().updateListPaging());
		});
		it('Should throw an error if there is no contextual list and paging data supplied.', () => {
			assert.throws(() => new Convo().updateListPaging({ start: 0, count: 1 }));
		});
		it('Should set paging to full list if there is a contextual list and no paging data supplied.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3'], { start: 1, count: 1 });
			assert(
				convo.getList().paging && convo.getList().paging.start === 1 && convo.getList().paging.count === 1,
				'Paging data not correct'
			);
			convo.updateListPaging();
			assert(
				convo.getList().paging && convo.getList().paging.start === 0 && convo.getList().paging.count === -1,
				'Paging data not correct'
			);
		});
		it('Should allow paging to be updated on an existing contextual list with paging data in range.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(
				convo.getList().paging && convo.getList().paging.start === 0 && convo.getList().paging.count === -1,
				'Paging data not correct'
			);
			convo.updateListPaging({ start: 1, count: 2 });
			assert(
				convo.getList().paging && convo.getList().paging.start === 1 && convo.getList().paging.count === 2,
				'Paging data not correct'
			);
		});
		it('Should throw error if start value is less than 0.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert.throws(() => convo.updateListPaging({ start: -1, count: 2 }));
		});
		it('Should throw error if count value is greater than list length.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert.throws(() => convo.updateListPaging({ start: 0, count: 10 }));
		});
		it('Should allow start to be updated individually.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === -1, 'Paging data not correct.');
			convo.updateListPaging({ start: 1 });
			assert(convo.getList().paging.start === 1 && convo.getList().paging.count === -1, 'Paging data not correct.');
		});
		it('Should allow count to be updated individually.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === -1, 'Paging data not correct.');
			convo.updateListPaging({ count: 2 });
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 2, 'Paging data not correct.');
		});
	});

	describe('#nextListPage', () => {
		it('Should repeat if paging is set to full list.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === -1, 'Pagin data incorrect.');
			convo.nextListPage();
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === -1, 'Pagin data incorrect.');
		});
		it('Should step through list pages by originally set count.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'], { start: 0, count: 2 });
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.nextListPage();
			assert(convo.getList().paging.start === 2 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.nextListPage();
			assert(convo.getList().paging.start === 4 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.nextListPage();
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 2, 'Paging data incorrect.');
		});
		it('Should step through list pages by changing counts.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'], { start: 0, count: 2 });
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.nextListPage(1);
			assert(convo.getList().paging.start === 2 && convo.getList().paging.count === 1, 'Paging data incorrect.');
			convo.nextListPage(3);
			assert(convo.getList().paging.start === 3 && convo.getList().paging.count === 3, 'Paging data incorrect.');
			convo.nextListPage(5);
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 5, 'Paging data incorrect.');
		});
		it('Should go to full page if count is set to negative.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3'], { start: 0, count: 2 });
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.nextListPage(-5);
			assert(convo.getList().paging.start === 2 && convo.getList().paging.count === -1, 'Paging data incorrect.');
			convo.nextListPage();
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === -1, `Paging data incorrect.${convo.getList().paging.start}:${convo.getList().paging.count}`);
		});
		it('Should throw error if count changes to something out of range.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'], { start: 0, count: 2 });
			assert.throws(() => convo.nextListPage(6));
		});
	});

	describe('#prevListPage', () => {
		it('Should repeat if paging is set to full list.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === -1,  `Paging data incorrect.${convo.getList().paging.start}:${convo.getList().paging.count}`);
			convo.prevListPage();
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === -1,  `Paging data incorrect.${convo.getList().paging.start}:${convo.getList().paging.count}`);
		});
		it('Should step through list pages by originally set count.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'], { start: 0, count: 2 });
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.prevListPage();
			assert(convo.getList().paging.start === 3 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.prevListPage();
			assert(convo.getList().paging.start === 1 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.prevListPage();
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.prevListPage();
			assert(convo.getList().paging.start === 3 && convo.getList().paging.count === 2, 'Paging data incorrect.');
		});
		it('Should step through list pages by changing counts.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'], { start: 0, count: 2 });
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.prevListPage(2);
			assert(convo.getList().paging.start === 3 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.prevListPage(3);
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 3, `Paging data incorrect.${convo.getList().paging.start}:${convo.getList().paging.count}`);
			convo.prevListPage(5);
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 5, 'Paging data incorrect.');
			convo.prevListPage(3);
			assert(convo.getList().paging.start === 2 && convo.getList().paging.count === 3, 'Paging data incorrect.');
		});
		it('Should go to full page if count is set to negative.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3'], { start: 0, count: 2 });
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === 2, 'Paging data incorrect.');
			convo.prevListPage(1);
			assert(convo.getList().paging.start === 2 && convo.getList().paging.count === 1, `Paging data incorrect.${convo.getList().paging.start}:${convo.getList().paging.count}`);
			convo.prevListPage(-5);
			assert(convo.getList().paging.start === 0 && convo.getList().paging.count === -1, `Paging data incorrect.${convo.getList().paging.start}:${convo.getList().paging.count}`);
		});
		it('Should throw error if count changes to something out of range.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'], { start: 0, count: 2 });
			assert.throws(() => convo.prevListPage(6));
		});
	});

	describe('#forListPage', () => {
		it('Should output pages based on standard paging calls.', (done) => {
			new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'], { start: 0, count: 2 })
				.forListPage(({ page }) => assert(page.length === 2 && page[0]==='item 1' && page[1]==='item 2', 'paging data incorrect'))
				.nextListPage()
				.forListPage(({ page }) => assert(page.length === 2 && page[0]==='item 3' && page[1]==='item 4', 'paging data incorrect'))
				.nextListPage()
				.forListPage(({ page }) => assert(page.length === 1 && page[0]==='item 5', 'paging data incorrect'))
				.nextListPage()
				.forListPage(({ page }) => assert(page.length === 2 && page[0]==='item 1' && page[1]==='item 2', 'paging data incorrect'))
				.promise(c => {
					done();
					return c;
				});
		});
		it('Should not call function if no list is set.', (done) => {
			let doneCalled = false;
			new Convo()
				.forListPage(({ page }) => {
					doneCalled = true;
					done(new Error('This method should not be called.'));
				})
				.promise(c => {
					!doneCalled && done();
					return c;
				});
		});
	});

	describe('#forList', () => {
		it('Should output entire list.', (done) => {
			new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'], { start: 0, count: 2 })
				.forList(({ list }) => assert(
					list.length === 5 &&
					list[0]==='item 1' && list[1]==='item 2' && list[2]==='item 3' && list[3]==='item 4' && list[4]==='item 5',
					'paging data incorrect'
				))
				.promise(c => {
					done();
					return c;
				});
		});
		it('Should not call function if no list is set.', (done) => {
			let doneCalled = false;
			new Convo()
				.forList(({ list }) => {
					doneCalled = true;
					done(new Error('This method should not be called.'));
				})
				.promise(c => {
					!doneCalled && done();
					return c;
				});
		});
	});

	describe('#selectFromList', () => {
		it('Should have nothing selected by default if contextual list exists.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5']);
			assert(convo.getList().selectedIndex === -1, 'selectedIndex is not -1');
		});
		it('Should throw error if no contextual list exists.', () => {
			assert.throws(() => new Convo().selectFromList(0));
		});
		it('Should allow items to be selected if contextual list exists', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			convo.selectFromList(0);
			assert(
				convo.getList().selectedIndex === 0 && convo.getList().list[convo.getList().selectedIndex]=== 'item 1',
				'selectedIndex is not 0'
			);
			convo.selectFromList(1);
			assert(
				convo.getList().selectedIndex === 1 && convo.getList().list[convo.getList().selectedIndex]=== 'item 2',
				'selectedIndex is not 1'
			);
			convo.selectFromList(2);
			assert(
				convo.getList().selectedIndex === 2 && convo.getList().list[convo.getList().selectedIndex]=== 'item 3',
				'selectedIndex is not 2'
			);
		});
		it('Should throw error if index is out of range.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert.throws(() => convo.selectFromList(3));
		});
		it('Should select first item if no index is passed', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			convo.selectFromList();
			assert(
				convo.getList().selectedIndex === 0 && convo.getList().list[convo.getList().selectedIndex]=== 'item 1',
				'selectedIndex is not 0'
			);
		});
		it('Should clear selection if index is less than 0', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			convo.selectFromList(0);
			assert(
				convo.getList().selectedIndex === 0 && convo.getList().list[convo.getList().selectedIndex]=== 'item 1',
				'selectedIndex is not 0'
			);
			convo.selectFromList(-2);
			assert(
				convo.getList().selectedIndex === -1,
				'selectedIndex is not -1'
			);
		});
	});

	describe('#selectFromListPage', () => {
		it('Should throw error if no contextual list exists.', () => {
			assert.throws(() => new Convo().selectFromListPage(0));
		});
		it('Should select items in full list page.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			convo.selectFromListPage(0);
			assert(
				convo.getList().selectedIndex === 0 && convo.getList().list[convo.getList().selectedIndex]=== 'item 1',
				'selectedIndex is not 0'
			);
			convo.selectFromListPage(1);
			assert(
				convo.getList().selectedIndex === 1 && convo.getList().list[convo.getList().selectedIndex]=== 'item 2',
				'selectedIndex is not 1'
			);
			convo.selectFromListPage(2);
			assert(
				convo.getList().selectedIndex === 2 && convo.getList().list[convo.getList().selectedIndex]=== 'item 3',
				'selectedIndex is not 2'
			);

		});
		it('Should select items in list page staring from start index.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3'], { start: 1, count: 2 });
			convo.selectFromListPage(0);
			assert(
				convo.getList().selectedIndex === 1 && convo.getList().list[convo.getList().selectedIndex]=== 'item 2',
				'selectedIndex is not 1'
			);
			convo.selectFromListPage(1);
			assert(
				convo.getList().selectedIndex === 2 && convo.getList().list[convo.getList().selectedIndex]=== 'item 3',
				'selectedIndex is not 2'
			);
			convo.selectFromListPage(0);
			assert(
				convo.getList().selectedIndex === 1 && convo.getList().list[convo.getList().selectedIndex]=== 'item 2',
				'selectedIndex is not 1'
			);

		});
		it('Should throw error is index if outside of page count.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3'], { start: 1, count: 2 });
			assert.throws(() => convo.selectFromListPage(5));
		});
		it('Should throw error is index is less than 0.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3'], { start: 1, count: 2 });
			assert.throws(() => convo.selectFromListPage(-1));
		});
	});

	describe('#selectNextFromList', () => {
		it('Should throw error if no contextual list exists.', () => {
			assert.throws(() => new Convo().selectNextFromList());
		});
		it('Should select first item if no selection exists', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			convo.selectNextFromList();
			assert(
				convo.getList().selectedIndex === 0 && convo.getList().list[convo.getList().selectedIndex]=== 'item 1',
				'selectedIndex is not 0'
			);
		});
		it('Should step through items on contextual list', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			convo.selectNextFromList();
			assert(
				convo.getList().selectedIndex === 0 && convo.getList().list[convo.getList().selectedIndex] === 'item 1',
				'selectedIndex is not 0'
			);
			convo.selectNextFromList();
			assert(
				convo.getList().selectedIndex === 1 && convo.getList().list[convo.getList().selectedIndex] === 'item 2',
				'selectedIndex is not 1'
			);
			convo.selectNextFromList();
			assert(
				convo.getList().selectedIndex === 2 && convo.getList().list[convo.getList().selectedIndex] === 'item 3',
				'selectedIndex is not 2'
			);
			convo.selectNextFromList();
			assert(
				convo.getList().selectedIndex === 0 && convo.getList().list[convo.getList().selectedIndex] === 'item 1',
				'selectedIndex is not 0'
			);
		});
	});

	describe('#selectPrevFromList', () => {
		it('Should throw error if no contextual list exists.', () => {
			assert.throws(() => new Convo().selectPrevFromList());
		});
		it('Should select last item if no selection exists', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			convo.selectPrevFromList();
			assert(
				convo.getList().selectedIndex === 2 && convo.getList().list[convo.getList().selectedIndex]=== 'item 3',
				'selectedIndex is not 0'
			);
		});
		it('Should step through items on contextual list', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			convo.selectPrevFromList();
			assert(
				convo.getList().selectedIndex === 2 && convo.getList().list[convo.getList().selectedIndex] === 'item 3',
				'selectedIndex is not 2'
			);
			convo.selectPrevFromList();
			assert(
				convo.getList().selectedIndex === 1 && convo.getList().list[convo.getList().selectedIndex] === 'item 2',
				'selectedIndex is not 1'
			);
			convo.selectPrevFromList();
			assert(
				convo.getList().selectedIndex === 0 && convo.getList().list[convo.getList().selectedIndex] === 'item 1',
				'selectedIndex is not 0'
			);
			convo.selectPrevFromList();
			assert(
				convo.getList().selectedIndex === 2 && convo.getList().list[convo.getList().selectedIndex] === 'item 3',
				'selectedIndex is not 2'
			);
		});
	});

	describe('#hasListSelection', () => {
		it('Should return false if no contextual list exists.', () => {
			assert(
				!new Convo().hasListSelection(),
				'there should be no selection.'
			);
		});
		it('Should return false if no selection exists.', () => {
			let convo = new Convo().setList('items', ['item 1', 'item 2', 'item 3']);
			assert(
				!convo.hasListSelection(),
				'there should be no selection.'
			);
		});
		it('Should return true if there is a selection.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3'])
				.selectFromList(0);
			assert(
				convo.hasListSelection(),
				'there should be a selection.'
			);
		});
	});

	describe('#clearListSelection', () => {
		it('Should return false if no contextual list exists.', () => {
			assert.throws(() => new Convo().clearListSelection());
		});
		it('Should return false if no selection exists.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3']);
			assert.doesNotThrow(() => convo.clearListSelection());
		});
		it('Should clear selection if one exists.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3'])
				.selectFromList(0);
			assert(
				convo.hasListSelection(),
				'there should be a selection.'
			);
			convo.clearListSelection();
			assert(
				!convo.hasListSelection(),
				'there should be no selection.'
			);
		});
	});

	describe('#getListSelection', () => {
		it('Should return null if contextual list exists, but no selection has been made.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3']);
			assert(
				!convo.getListSelection(),
				`there should not be a selection.${JSON.stringify(convo.getListSelection(), null, 2)}`
			);
		});
		it('Should return selection data if contextual list and selection exists.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3'])
				.selectFromList(0);
			assert(
				convo.getListSelection() && convo.getListSelection().index === 0 && convo.getListSelection().item === 'item 1',
				`there should not be a selection.${JSON.stringify(convo.getListSelection(), null, 2)}`
			);
		});
		it('Should have list selection and selection match when selection is from list.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3'])
				.selectFromList(0);
			assert(
				convo.getListSelection().item === convo.getSelection().item,
				`there should not be a selection.${JSON.stringify(convo.getListSelection(), null, 2)}`
			);
		});
		it('Should not have list selection and selection match when selection is not from list.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3'])
				.selectFromList(0)
				.select('thing', 'item 4');
			assert(convo.getListSelection().item !== convo.getSelection().item);
		});
		it('Should have list section override a direct selection.', () => {
			let convo = new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3'])
				.select('thing', 'item 4')
				.selectFromList(0);
			assert(convo.getListSelection().item === convo.getSelection().item);
		});
	});

	describe('#forListSelection', () => {
		it('Should output selection if it exists.', (done) => {
			new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'])
				.selectFromList(0)
				.forListSelection(({ item, type }) => assert(
					item === 'item 1' &&
					type === 'items',
					'selected data incorrect'
				))
				.promise(c => {
					done();
					return c;
				});
		});
		it('Should not call function if no contextual list is set.', (done) => {
			let doneCalled = false;
			new Convo()
				.forListSelection(({ item }) => {
					doneCalled = true;
					done(new Error('This method should not be called.'));
				})
				.promise(c => {
					!doneCalled && done();
					return c;
				});
		});
		it('Should not call function if no selection is set.', (done) => {
			let doneCalled = false;
			new Convo()
				.setList('items', ['item 1', 'item 2', 'item 3', 'item 4', 'item 5'])
				.forListSelection(({ item }) => {
					doneCalled = true;
					done(new Error('This method should not be called.'));
				})
				.promise(c => {
					!doneCalled && done();
					return c;
				});
		});
	});


});
