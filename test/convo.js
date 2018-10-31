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

});
