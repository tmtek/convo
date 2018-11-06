let { Convo } = require('../src/convo');
let { ConvoApp } = require('../src/convo-app');
let { ConvoTest } = require('../src/convo-test');
let assert = require('assert');

describe('ConvoApp', () => {

	describe('#ensureNumber', () => {
		it('Should return number if number is passed', () => {
			let val = 10;
			assert(ConvoApp.ensureNumber(val) === 10);
		});
		it('Should return number if string is passed', () => {
			let val = '10';
			assert(ConvoApp.ensureNumber(val) === 10);
		});
		it('Should return false if string not a number', () => {
			let val = 'hi';
			assert(!ConvoApp.ensureNumber(val));
		});
		it('Should return false if object passed ', () => {
			let val = {};
			assert(!ConvoApp.ensureNumber(val));
		});
		it('Should return false if null passed ', () => {
			let val = null;
			assert(!ConvoApp.ensureNumber(val));
		});
	});

	describe('#correctForZeroIndex', () => {
		it('Should decrement any number by onRespondForList', () => {
			let val = 10;
			assert(ConvoApp.correctForZeroIndex(val) === 9);
		});
		it('Should ensure the number can never go lower than 0.', () => {
			let val = 0;
			assert(ConvoApp.correctForZeroIndex(val) === 0);
		});
		it('Should throw error if submitted value is not a number.', () => {
			assert.throws(() => ConvoApp.correctForZeroIndex('0'));
			assert.throws(() => ConvoApp.correctForZeroIndex({}));
			assert.throws(() => ConvoApp.correctForZeroIndex([]));
			assert.throws(() => ConvoApp.correctForZeroIndex(null));
			assert.throws(() => ConvoApp.correctForZeroIndex());
		});
	});

	describe('#constructor', () => {
		it('Should call onRegisterItents after construction', (done) => {
			class MyApp extends ConvoApp {
				onRegisterIntents() {
					done();
				}
			}
			new MyApp();
		});
		it('Should call onPrepareHelp after construction', (done) => {
			class MyApp extends ConvoApp {
				onPrepareHelp() {
					done();
					return [];
				}
			}
			new MyApp();
		});
	});

	describe('#setClassMappings', () => {
		it('Should allow set class mappings to override defaults', () => {
			let contents = { id: 'test' };
			let mapFunc = data => data;
			new ConvoApp().setClassMappings({
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

	describe('#registerIntent', () => {
		it('Should allow intents to be registered by name. Duplicates should override each other.', () => {
			let app = new ConvoApp();
			app.registerIntent('intent1', () => {});
			app.registerIntent('intent2', () => {});
			app.registerIntent('intent3', () => {});
			app.registerIntent('intent3', () => {});
			assert(Object.keys(app.registeredIntents).length === 3);
		});
		it('Should error if you do not submit an intent.', () => {
			assert.throws(() => new ConvoApp().registerIntent());
		});
		it('Should error if you do not submit an intent handler.', () => {
			assert.throws(() => new ConvoApp().registerIntent('intent1'));
		});
	});

	describe('#intent', () => {
		it('Should error if no convo is submitted', () => {
			let app = new ConvoApp();
			assert.throws(() => app.intent());
		});
		it('Should error if no intent is submitted', () => {
			let app = new ConvoApp();
			assert.throws(() => app.intent(new Convo()));
		});
		it('Should fail silently if you call method when no handler is registered.', () => {
			let app = new ConvoApp();
			assert.doesNotThrow(() => app.intent(new Convo(), 'test'));
		});
		it('Should call registered intent handler', (done) => {
			let app = new ConvoApp().registerIntent('test', () => {
				done();
			});
			app.intent(new Convo(), 'test');
		});
		it('Should call registered intent handler and get all arguments', (done) => {
			let app = new ConvoApp().registerIntent('test', (convo, params, option, debug) => {
				assert(convo, 'Convo was not submitted');
				assert(params && params.testParam && params.testParam === 'test', 'params was not submitted');
				assert(option && option.testOption && option.testOption === 'test', 'options was not submitted');
				assert(debug && !debug.log, 'debug was not submitted');
				done();
			});
			app.intent(new Convo(), 'test', { testParam: 'test' }, { testOption: 'test' }, { log: false });
		});
		it('Should return Promise when no intent registered.', (done) => {
			let app = new ConvoApp();
			app.intent(new Convo(), 'test')
				.then(({ convo }) => {
					assert(convo, 'No Convo returned.');
					done();
				});
		});
		it('Should return Promise when intent registered and intent handler does not return promise.', (done) => {
			let app = new ConvoApp().registerIntent('test', () => {});
			app.intent(new Convo(), 'test')
				.then(({ convo }) => {
					assert(convo,'No Convo returned.');
					done();
				});
		});
		it('Should return Promise when intent registered, intent handler does return promise, and requests are made.', (done) => {
			let app = new ConvoApp().registerIntent('test', () => Convo.ask(new Convo().write('hi.')));
			app.intent(new Convo(), 'test')
				.then(({ convo, requests }) => {
					assert(convo,'No Convo returned.');
					assert(requests,'No requests returned.');
					done();
				});
		});
	});

	describe('#bind', () => {
		it('Should bind all registered intents to dialogflow app.', (done) => {
			let app = new ConvoApp()
				.registerIntent('test 1', () => Convo.ask(new Convo().write('test intent 1')))
				.registerIntent('test 2', () => Convo.ask(new Convo().speak('test intent 2')))
				.registerIntent('test 3', () => Convo.ask(new Convo().write('hi').speak('test intent 3', false)))
				.registerIntent('test 3', () => Convo.ask(new Convo().speak('test intent 4').present(Convo.List({ title: 'list' }))));
			class DialogFlowApp {

				constructor() {
					this.registeredIntents = [];
				}

				intent(intent, intentHandler) {
					this.registeredIntents.push({ intent, intentHandler });
				}
			}
			let dialogflowApp = new DialogFlowApp();
			app.bind(dialogflowApp);
			assert(dialogflowApp.registeredIntents.length === Object.keys(app.registeredIntents).length, 'Intents were not registered properly.');
			dialogflowApp.registeredIntents.forEach((registeredIntent, i) => {
				assert(app.registeredIntents[dialogflowApp.registeredIntents[i].intent], `${dialogflowApp.registeredIntents[i].intent} not registered properly`);
			});
			let isDone = false;
			Promise.all(dialogflowApp.registeredIntents.map(registeredIntent => registeredIntent.intentHandler(Convo.mockConv(), {}, {})
				.then(({ convo, requests }) => {
					assert(convo, 'convo was not returned');
					assert(requests.length > 0, `requests for ${registeredIntent.intent} was not returned`);
				}))).catch(err => {
				isDone = true;
				done(err);
			}).then(() => !isDone && done());
		});
	});

	describe('#presentList', () => {
		it('Should call onRespondForList when list is presented with no paging', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list)
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					assert(convo);
					assert(type === 'items');
					assert(page && page.length === 5);
					assert(paging && paging.start === 0 && paging.count === -1);
					assert(list && list.length === 5);
					done();
				}

			}
			new MyApp().intent(new Convo(), 'applyList');
		});
		it('Should call onRespondForList when list is presented with paging', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: 2 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					assert(convo);
					assert(type === 'items');
					assert(page && page.length === 2);
					assert(paging && paging.start === 0 && paging.count === 2);
					assert(list && list.length === 5);
					done();
				}

			}
			new MyApp().intent(new Convo(), 'applyList');
		});
	});

	describe('#presentSelection', () => {
		it('Should call onRespondForSelection when selection is presented', (done) => {
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerIntent('selectThing', (convo, params, option) => Convo.ask(
						this.presentSelection(convo, 'thing', { value: 'test' })
					));
				}
				onRespondForSelection({ convo, type, item }) {
					assert(convo);
					assert(type === 'thing');
					assert(item);
					assert(item.value === 'test');
					done();
				}

			}
			new MyApp().intent(new Convo(), 'selectThing');
		});
	});

	describe('#registerListIntents', () => {
		it('Should be able to repeat the list with list_repeat', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: 2 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}

			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_repeat'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able to page through list with list_next and have it loop back.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: 2 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}

			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_next'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 2);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_next'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 4);
					assert(count === 2);
					assert(pageLength === 1);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_next'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able to page through list with list_prev and have it loop back.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: 2 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}

			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_prev'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 3);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_prev'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 1);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_prev'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able to page through list with list_next and have it loop back while changing page sizes.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: 2 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}

			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_next', { count: 3 }))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 2);
					assert(count === 3);
					assert(pageLength === 3);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_next'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 3);
					assert(pageLength === 3);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_next', { count: 1 }))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 3);
					assert(count === 1);
					assert(pageLength === 1);
					assert(listLength === 5);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able to page through list with list_prev and have it loop back while changing page sizes.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: 2 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}

			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_prev', { count: 3 }))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 2);
					assert(count === 3);
					assert(pageLength === 3);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_prev', { count: 1 }))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 1);
					assert(count === 1);
					assert(pageLength === 1);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_prev'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 1);
					assert(pageLength === 1);
					assert(listLength === 5);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able to use list_all to move from a paged list to full list.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: 2 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}

			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === 2);
					assert(pageLength === 2);
					assert(listLength === 5);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_all'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, count, start, pageLength, listLength } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(start === 0);
					assert(count === -1);
					assert(pageLength === 5);
					assert(listLength === 5);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able to use list_select to select an item in the full list.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: -1 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}
				onRespondForSelection({ convo, type, item }) {
					return convo.speak(JSON.stringify({
						type,
						item
					}));
				}
			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select', { index: 2 }))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 2', `Was actually ${item}`);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able to use list_select_ui to select an item in the full list.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: -1 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}
				onRespondForSelection({ convo, type, item }) {
					return convo.speak(JSON.stringify({
						type,
						item
					}));
				}
			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select_ui', null, 'item_1'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 2', `Was actually ${item}`);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able to use list_select to select an item in on a list page.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 2, count: 2 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}
				onRespondForSelection({ convo, type, item }) {
					return convo.speak(JSON.stringify({
						type,
						item
					}));
				}
			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select', { index: 2 }))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 4', `Was actually ${item}`);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able select the next item after a currently select one with list_select_next and have it loop.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: -1 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}
				onRespondForSelection({ convo, type, item }) {
					return convo.speak(JSON.stringify({
						type,
						item
					}));
				}
			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select', { index: 2 }))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 2', `Was actually ${item}`);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select_next'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 3', `Was actually ${item}`);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select_next'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 4', `Was actually ${item}`);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select_next'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 5', `Was actually ${item}`);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select_next'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 1', `Was actually ${item}`);
					return { app, convo, requests };
				})
			, done);
		});
		it('Should be able select the previous item before a currently select one with list_select_prev and have it loop.', (done) => {
			let list = ['test 1', 'test 2', 'test 3', 'test 4', 'test 5'];
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerIntent('applyList', (convo, params, option) => Convo.ask(
						this.presentList(convo, 'items', list, { start: 0, count: -1 })
					));
				}
				onRespondForList({ convo, type, page, paging, list }) {
					return convo.speak(JSON.stringify({
						type,
						start: paging.start,
						count: paging.count,
						pageLength: page.length,
						listLength: list.length
					}));
				}
				onRespondForSelection({ convo, type, item }) {
					return convo.speak(JSON.stringify({
						type,
						item
					}));
				}
			}

			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'applyList')
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select', { index: 2 }))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 2', `Was actually ${item}`);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select_prev'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 1', `Was actually ${item}`);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select_prev'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 5', `Was actually ${item}`);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select_prev'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 4', `Was actually ${item}`);
					return { app, convo, requests };
				})
				.then(({ app, convo, requests }) => app.intent(new Convo(convo), 'list_select_prev'))
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					let { type, item } = JSON.parse(requests[0].payload.data.speech);
					assert(type === 'items');
					assert(item === 'test 3', `Was actually ${item}`);
					return { app, convo, requests };
				})
			, done);
		});
	});

	describe('#registerHelpIntent', () => {
		it('Should be able to activate Help with help', (done) => {
			class MyApp extends ConvoApp {
				onRegisterIntents(){
					this.registerListIntents();
					this.registerHelpIntent();
				}
				onPrepareHelp() {
					return [
						{
							description: 'help 1',
							tips: [
								{ text: 'tip 1' },
								{ text: 'tip 2' },
								{ text: 'tip 3' }
							]
						},
						{
							description: 'help 2',
							tips: [
								{ text: 'tip 1' },
								{ text: 'tip 2' },
								{ text: 'tip 3' }
							]
						},
						{
							description: 'help 3',
							tips: [
								{ text: 'tip 1' },
								{ text: 'tip 2' },
								{ text: 'tip 3' }
							]
						}
					];
				}
			}
			ConvoTest.testConversation(new MyApp()
				.intent(new Convo(), 'help')
				.then(({ app, convo, requests }) => {
					assert(requests && requests.length > 0);
					assert(convo.hasList('help'));
					return { app, convo, requests };
				})
			, done);
		});
	});

});
