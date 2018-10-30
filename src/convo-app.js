const { Convo } = require('./convo');
const { Say } = require('./say');

class ConvoApp {

	static ensureNumber(value) {
		if (!value) {
			return value;
		}
		return (typeof value === 'string' || value instanceof String) ? parseInt(value, 10) : value;
	}

	static correctForZeroIndex(value) {
		return value >= 1 ? value -1 : value;
	}

	constructor() {
		this.registeredIntents = [];
		this.onRegisterIntents();
		this._help = this.onPrepareHelp();
	}

	setClassMappings(obj){
		Convo.setClassMappings(obj);
		return this;
	}

	onRegisterIntents() {}

	registerIntent(intent, intentHandler) {
		this.registeredIntents.push({ intent, intentHandler });
	}

	bind(dialogFlowApp) {
		this.registeredIntents.forEach(({ intent, intentHandler }) => {
			dialogFlowApp.intent(intent, (conv, params, extra) => intentHandler(new Convo(conv), params, extra));
		});
		return dialogFlowApp;
	}

	intent(convo, intent, params = {}, option = {}, debugOptions = {}){
		let registeredIntent = this.registeredIntents.filter(registeredIntent => registeredIntent.intent === intent)[0];
		return registeredIntent.intentHandler(convo, params, option, debugOptions).then(convo => ({ app: this, convo }));
	}

	registerListIntents() {
		this.registerIntent('list_clear', (convo, params, option, debug) => Convo.ask(
			convo
				.clearList(),
			debug
		));

		this.registerIntent('list_repeat', (convo, params, option, debug) => Convo.ask(
			convo.forListPage(data => this._onRespondForList(data)),
			debug
		));

		this.registerIntent('list_next', (convo, params, option, debug) => Convo.ask(
			convo
				.nextListPage(params ? ConvoApp.ensureNumber(params.count) : -1)
				.forListPage(data => this._onRespondForList(data)),
			debug
		));

		this.registerIntent('list_prev', (convo, params, option, debug) => Convo.ask(
			convo
				.prevListPage(params ? ConvoApp.ensureNumber(params.count) : -1)
				.forListPage(data => this._onRespondForList(data)),
			debug
		));

		this.registerIntent('list_all', (convo, params, option, debug) => Convo.ask(convo
			.updateListPaging({ start: 0, count: -1 })
			.forListPage(data => this._onRespondForList(data)),debug));

		this.registerIntent('list_select', (convo, { index }, option, debug) => Convo.ask(convo
			.selectFromListPage(ConvoApp.correctForZeroIndex(ConvoApp.ensureNumber(index)))
			.forListSelection(data => this._onRespondForListSelection(data)), debug
		));

		this.registerIntent('list_find', (convo, { query }, option, debug) => Convo.ask(convo
			.selectFromListByQuery(query, this.onQueryListForSelection)
			.forListSelection(data => this._onRespondForListSelection(data)), debug
		));

		this.registerIntent('list_select_next', (convo, params, option, debug) => Convo.ask(
			convo
				.selectNextFromList()
				.forListSelection(data => this._onRespondForListSelection(data)),
			debug)
		);

		this.registerIntent('list_select_prev', (convo, params, option, debug) => Convo.ask(
			convo
				.selectPrevFromList()
				.forListSelection(data => this._onRespondForListSelection(data)),
			debug));

		this.registerIntent('list_select_ui', (convo, params, option, debug) =>
			Convo.ask(convo
				.promise(c => {
					let listContext = c.getContext('list');
					return this.onListSelectUI(c, listContext.type, option);
				})
				.then(c => c.forListSelection(data => this._onRespondForListSelection(data)))
			, debug)
		);
	}

	onListSelectUI(convo, type, itemName) {
		return convo.selectFromListPage(ConvoApp.ensureNumber(itemName.split('_')[1]));
	}

	_onRespondForList({ convo, type, page, paging, list }) {
		if (type === 'help') {
			return this.respondForHelpTopics({ convo, type, page, paging, list });
		}
		return this.onRespondForList({ convo, type, page, paging, list });
	}

	onRespondForList({ convo, type, page, paging, list }) {
		return convo.speak('Not sure what these are.');
	}

	onQueryListForSelection(type, item, query) {
		return false;
	}

	_onRespondForListSelection({ convo, type, item }) {
		if (type === 'help') {
			return this.respondForHelpTopic({ convo, type, item });
		}
		return this.onRespondForListSelection({ convo, type, item });
	}

	onRespondForListSelection({ convo, type, item }) {
		return convo.speak('Nothing was selected');
	}

	registerHelpIntent() {
		this.registerIntent('help', (convo, params, option, debug) => {
			if (this._help) {
				if (this._help.length > 1) {
					return Convo.ask(convo
						.setList('help', this._help, { start: 0, count: -1 })
						.forListPage(data => this._onRespondForList(data)),
					debug);
				}
				return Convo.ask(this.respondForHelpTopic({ convo, type: 'help', item: this._help[0] }, false), debug);
			}
			return Convo.close(convo.speak('No help available.'), debug);
		});
	}

	onPrepareHelp() {
		return [];
	}

	respondForHelpTopics({ convo, type, page, paging, list }) {
		if (!convo.isInStorage('help_intro', intro => intro.ran)) {
			convo.speak(`Before you are presented with the list of help topics, know that you can say "Select the first one", or "Select the second one", etc to get more details on any of the topics presented to you.`, false)
				.setToStorage('help_intro', { ran: true });
		}
		return convo.speak('Here are the help topics:')
			.speak(Say.listPageResponse(page, paging, list, item => Say.ensureSentence(item.description), '\n\n'), false)
			.present(
				Convo.List({
					title: 'Help Topics',
					items: Say.listItems(
						list,
						item => ({ title: item.description, description: `${item.tips.length} tips` })
					)
				}),
				'actions.capability.SCREEN_OUTPUT'
			);
	}

	respondForHelpTopic({ convo, type, item }, inListContext = true) {
		return convo
			.speak(item.description)
			.speak(inListContext ? 'Before we read the tips, know that you can say "back to list" to return to the help topics.\n\n': null)
			.speak(item.tips.reduce((say, tip) => say.sentence(`${tip.text}\n\n`), new Say()), !item.tips.length > 1)
			.present(
				item.tips.length > 1 ?
					Convo.List({
						title: 'Tips',
						items: Say.listItems(
							item.tips,
							tip => ({ title: tip.text }),
							(item, i) => `tip${i}`
						)
					}) : null,
				'actions.capability.SCREEN_OUTPUT'
			);
	}

}

module.exports = { ConvoApp };
