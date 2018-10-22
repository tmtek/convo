const { Convo, ConvoApp } = require(`./index`);


class MyApplication extends ConvoApp {

	onRegisterIntents() {

		let responseToList = listData => {
			if (!listData.list) {
				return listData.convo.speak('The list is empty.');
			}
			listData.convo.speak(listData.page.map(item => item.display_name).join(','));
			if (listData.page.length < listData.list.length){
				listData.convo.speak(`and ${listData.list.length - listData.page.length} others.`);
			}
		};

		let responseToItem = ({ convo, item }) => {
			convo.speak(`Selected item: ${item.display_name}`);
		};

		this.registerIntent('welcome', (convo, params, option, debug) => {
			let list = [
				{ display_name: 'KingGothalion' },
				{ display_name: 'Ninja' },
				{ display_name: 'professorbroman' },
				{ display_name: 'tmtek' }
			];
			return Convo.ask(
				convo.speak("Here's your list:")
					.setList('general', list, { start: 0, count: 3 })
					.forListPage(responseToList),
				debug
			);
		});

		this.registerIntent('list_clear', (convo, params, option, debug) => Convo.ask(
			convo
				.clearList()
				.speak('Cleared the list.'),
			debug
		));

		this.registerIntent('list_next', (convo, params, option, debug) => Convo.ask(
			convo
				.nextListPage(params ? params.count : -1)
				.forListPage(responseToList),
			debug
		));

		this.registerIntent('list_prev', (convo, params, option, debug) => Convo.ask(
			convo
				.prevListPage(params ? params.count : -1)
				.forListPage(responseToList),
			debug
		));

		this.registerIntent('list_all', (convo, params, option, debug) => Convo.ask(convo
			.updateListPaging({ start: 0, count: -1 })
			.forListPage(responseToList),debug));

		this.registerIntent('list_select', (convo, { index }, option, debug) => Convo.ask(convo
			.selectFromListPage(index)
			.forListSelected(responseToItem), debug
		));

		this.registerIntent('list_find', (convo, { query }, option, debug) => Convo.ask(convo
			.selectFromListByQuery(query, (item) => item.display_name)
			.forListSelected(responseToItem), debug
		));

		this.registerIntent('list_select_next', (convo, params, option, debug) => Convo.ask(
			convo
				.selectNextFromList()
				.forListSelected(responseToItem),
			debug)
		);

		this.registerIntent('list_select_prev', (convo, params, option, debug) => Convo.ask(
			convo
				.selectPrevFromList()
				.forListSelected(responseToItem),
			debug));
	}
}

new MyApplication()
	.intent(new Convo(), 'welcome', null, null, { log: true })
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_find', { query: 'bro' }, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_select_next', null, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_select_next', null, null, { log: true }))
	.then(({ app,convo }) => app.intent(new Convo(convo), 'list_select_next', null, null, { log: true }));

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
