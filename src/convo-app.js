const { Convo } = require('./convo');

class ConvoApp {

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
}

module.exports = { ConvoApp };
