let { ConvoTest } = require('../src/convo-test');
let { ConvoApp } = require('../src/convo-app');
let { Convo } = require('../src/convo');
let assert = require('assert');

describe('ConvoTest', () => {
	describe('#containsResponseType', () => {
		it('Should return true if requests contain the supplied type.', () => {
			let requests = [
				{ action: 'ask', payload: { type: 'SimpleResponse' } },
				{ action: 'ask', payload: { type: 'List' } }
			];
			assert(ConvoTest.containsResponseType(requests, ['SimpleResponse']));
			assert(ConvoTest.containsResponseType(requests, ['List']));
			assert(ConvoTest.containsResponseType(requests, ['SimpleResponse', 'List']));
		});
		it('Should return false if a named type does not exist in the requests.', () => {
			let requests = [
				{ action: 'ask', payload: { type: 'SimpleResponse' } },
				{ action: 'ask', payload: { type: 'List' } }
			];
			assert(!ConvoTest.containsResponseType(requests, ['Card']));
			assert(!ConvoTest.containsResponseType(requests, ['SimpleResponse', 'Card']));
			assert(!ConvoTest.containsResponseType(requests, ['List', 'Card']));
		});
		it('Should throw error if responses are null', () => {
			assert.throws(() => ConvoTest.containsResponseType(null, ['SimpleResponse']));
		});
		it('Should return false if requests are empty', () => {
			assert(!ConvoTest.containsResponseType([], ['SimpleResponse']));
		});
		it('Should return false if no types are supplied', () => {
			let requests = [
				{ action: 'ask', payload: { type: 'SimpleResponse' } },
				{ action: 'ask', payload: { type: 'List' } }
			];
			assert(!ConvoTest.containsResponseType(requests, []));
			assert(!ConvoTest.containsResponseType(requests));
		});
	});
	describe('#isConversationClose', () => {
		it('Should return false if the requests are asks.', () => {
			let requests = [
				{ action: 'ask', payload: { type: 'SimpleResponse' } },
				{ action: 'ask', payload: { type: 'List' } }
			];
			assert(!ConvoTest.isConversationClose(requests));
		});
		it('Should return true if the requests are close.', () => {
			let requests = [
				{ action: 'close', payload: { type: 'SimpleResponse' } }
			];
			assert(ConvoTest.isConversationClose(requests));
		});
		it('Should return true if the first request is close.', () => {
			let requests = [
				{ action: 'close', payload: { type: 'SimpleResponse' } },
				{ action: 'ask', payload: { type: 'List' } }
			];
			assert(ConvoTest.isConversationClose(requests));
		});
		it('Should throw error if you don\'t supply requests.', () => {
			assert.throws(() => !ConvoTest.isConversationClose());
		});
		it('Should return false if requests are empty.', () => {
			assert(!ConvoTest.isConversationClose([]));
		});
	});
	describe('#testConversation', () => {
		it('Should complete when an intent is simulated', (done) => {
			let app = new ConvoApp()
				.registerIntent('welcome', ( convo, params, option ) => {Convo.ask(convo.speak('Hi'));});
			ConvoTest.testConversation(
				app.intent(new Convo(), 'welcome'),
				done
			);
		});
		it('Should complete when multiple intents are simulated', (done) => {
			let app = new ConvoApp()
				.registerIntent('welcome', ( convo, params, option ) => {Convo.ask(convo.speak('Hi'));})
				.registerIntent('another_intent', ( convo, params, option ) => {Convo.ask(convo.speak('Hi'));});
			ConvoTest.testConversation(
				app.intent(new Convo(), 'welcome')
					.then(({ app, convo }) => app.intent(new Convo(convo), 'another_intent')),
				done
			);
		});
		it('Should fail when an error is thrown', (done) => {
			let app = new ConvoApp()
				.registerIntent('welcome', ( convo, params, option ) => {Convo.ask(convo.speak('Hi'));});
			ConvoTest.testConversation(
				app.intent(new Convo(), 'welcome')
					.then(() => {
						throw new Error('Test Error');
					}),
				(potentialError) => {potentialError ? done() : done('We did not catch the error that was thrown.');}
			);
		});
		it('Should throw error if conversation promise not passed.', () => {
			assert.throws(() => ConvoTest.testConversation(null, (error) => {}));
			assert.throws(() => ConvoTest.testConversation({}, (error) => {}));
		});
		it('Should throw error if done function not passed', () => {
			let app = new ConvoApp()
				.registerIntent('welcome', ( convo, params, option ) => {Convo.ask(convo.speak('Hi'));});
			assert.throws(() => ConvoTest.testConversation(
				app.intent(new Convo(), 'welcome')
			));
		});
	});
});
