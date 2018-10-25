const { Convo } = require('./convo');

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

		this.registerIntent('list_next', (convo, params, option, debug) => Convo.ask(
			convo
				.nextListPage(params ? ConvoApp.ensureNumber(params.count) : -1)
				.forListPage(this.onRespondForList),
			debug
		));

		this.registerIntent('list_prev', (convo, params, option, debug) => Convo.ask(
			convo
				.prevListPage(params ? ConvoApp.ensureNumber(params.count) : -1)
				.forListPage(this.onRespondForList),
			debug
		));

		this.registerIntent('list_all', (convo, params, option, debug) => Convo.ask(convo
			.updateListPaging({ start: 0, count: -1 })
			.forListPage(this.onRespondForList),debug));

		this.registerIntent('list_select', (convo, { index }, option, debug) => Convo.ask(convo
			.selectFromListPage(ConvoApp.correctForZeroIndex(ConvoApp.ensureNumber(index)))
			.forListSelection(this.onRespondForListSelection), debug
		));

		this.registerIntent('list_find', (convo, { query }, option, debug) => Convo.ask(convo
			.selectFromListByQuery(query, this.onQueryListForSelection)
			.forListSelection(this.onRespondForListSelection), debug
		));

		this.registerIntent('list_select_next', (convo, params, option, debug) => Convo.ask(
			convo
				.selectNextFromList()
				.forListSelection(this.onRespondForListSelection),
			debug)
		);

		this.registerIntent('list_select_prev', (convo, params, option, debug) => Convo.ask(
			convo
				.selectPrevFromList()
				.forListSelection(this.onRespondForListSelection),
			debug));
	}

	onRespondForList(listData) {
		return listData.convo;
	}

	onQueryListForSelection(type, item, query) {
		return false;
	}

	onRespondForListSelection(listSelectionData) {
		return listSelectionData.convo;
	}

}

module.exports = { ConvoApp };
