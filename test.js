const { Convo, ConvoApp, Say } = require(`./index`);


class MyApplication extends ConvoApp {

	onRespondForList({ convo, type, page, paging, list }) {
		if (type === 'channel') {
			return convo.speak(Say.listPageResponse(page, paging, list, item => item.display_name));
		}
		return convo.speak('Not sure what these are.');

	}

	onRespondForListSelection({ convo, type, item }) {
		if (type === 'channel' && item) {
			return convo.speak(`Selected item: ${item.display_name}`);
		}
		return convo.speak('Nothing was selected');
	}

	onQueryListForSelection(type, item, query) {
		if (type === 'channel' && item) {
			return new RegExp(query.toLowerCase()).test(item.display_name.toLowerCase());
		}
		return false;
	}

	onRegisterIntents() {

		this.registerListIntents();

		this.registerIntent('welcome', (convo, params, option, debug) => {
			let list = [
				{ display_name: 'KingGothalion' },
				{ display_name: 'Ninja' },
				{ display_name: 'professorbroman' }
			];
			return Convo.ask(
				convo.speak("Here's your list:")
					.setList('channel', list, { start: 0, count: 5 })
					.forListPage(this.onRespondForList),
				debug
			);
		});
	}
}

new MyApplication()
	.intent(new Convo(), 'welcome', null, null, { log: true })
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_find', { query: 'ninja' }, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_select_next', null, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_select_next', null, null, { log: true }));
//.then(({ app,convo }) => app.intent(new Convo(convo), 'list_next', null, null, { log: true }))
//.then(({ app,convo }) => app.intent(new Convo(convo), 'list_next', null, null, { log: true }));

/*
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_find', { query: 'king' }, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_select_next', null, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_select_next', null, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_select_next', null, null, { log: true }));
	*/

/*
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_next', null, null, { log: true }))
	.then(({ app, convo }) => app.intent(new Convo(convo), 'list_select', { index: 0 }, null, { log: true }))
	.then(({ app, convo }) => app.intent(new Convo(convo), 'list_select_next', null, null, { log: true }));
	*/

/*
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_all', null, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_next', { count: 2 }, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_next', { count: 2 }, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_clear', null, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_all', null, null, { log: true }));
	*/

/*
class MyApplication extends ConvoApp {

	onRegisterIntents() {

		this.registerIntent('welcome', (convo, params, option, debug) => Convo.ask(convo.speak('Welcome to my application!'), debug));

		this.registerIntent('my_fav_color', (convo, params, option, debug) => Convo.ask(
			convo
				.speak('my favorite color is red.')
				.speak('What is your favorite color?'),
			debug
		));

		this.registerIntent('your_fav_color', (convo, { color }, option, debug) => Convo.ask(
			convo.speak(`${color} is an amazing choice!`),
			debug
		));
	}
}
*/

/*
new MyApplication()
//User starts your application, and you respond:
.intent(new Convo(), 'welcome', null, null, { log: true })

//User asks for your favorite color:
.then(({ app, convo }) =>
	app.intent(new Convo(convo), 'my_fav_color', null, null, { log: true })
)

//User responds with "blue":
.then(({ app, convo }) =>
	app.intent(new Convo(convo), 'your_fav_color', { color: 'green' }, null, { log: true })
);
*/

/*
let convo = new Convo()
	.onStorageUpdated(storage => {console.log(storage)}) //fires after setToStorage call.
	.setStorage({}) //populates storage with data (doesn't trigger onStorageUpdated).
	.setToStorage("list", ["one","two","three"]); //Add value to storage.

convo.isInStorage("list", list => list.length > 0); //returns true
convo.getFromStorage("list"); //returns ["one","two","three"]

*/
