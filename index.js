class Say {

	static append(val) {
		return new Say().append(val);
	}

	static sentence(val) {
		return new Say().sentence(val);
	}

	constructor() {
		this.str = '';
	}

	append(val) {
		this.str += val;
		return this;
	}

	newline() {
		return this.append('\n');
	}

	paragraph() {
		return this.newline().newline();
	}

	sentence(val) {
		return this.append(' ').append(val);
	}

	toString() {
		return this.str.trim();
	}

}

class Convo {

	static mockConv() {
		return {
			surface: {
				capabilities: {
					has: () => true
				}
			},
			available: {
				surfaces: {
					capabilities: {
						has: () => true
					}
				}
			},
			user: {
				access: {},
				storage: {}
			},
			contexts: {}
		};
	}

	static setClassMappings(mappings) {
		this._clsMappings = mappings;
	}

	/**
	 * @private
	 */
	static processMethod(type, data) {
		return this._clsMappings && this._clsMappings[type] ? this._clsMappings[type](data) : { type, data };
	}

	/* eslint-disable new-cap */

	static SignIn(obj) {
		return this.processMethod('SignIn', obj);
	}

	static SimpleResponse(obj) {
		return this.processMethod('SimpleResponse', obj);
	}

	static NewSurface(obj) {
		return this.processMethod('NewSurface', obj);
	}

	static Image(obj) {
		return this.processMethod('Image', obj);
	}

	static List(obj) {
		return this.processMethod('List', obj);
	}

	static BasicCard(obj) {
		return this.processMethod('BasicCard', obj);
	}

	static Button(obj) {
		return this.processMethod('Button', obj);
	}

	static isNotEmpty(str) {
		return str && str.trim() !== '';
	}

	static complete(convo, action = 'close', options = { log: false, logFunc: null }) {
		if (!convo.conv){
			if (options.log) {
				console.log(`${action}:${JSON.stringify(convo, null, 1)}`);
			}
			return Promise.resolve(convo);
		}
		let finalText = convo._write.reduce((acc, text) => acc.sentence(text), new Say()).toString().trim();
		let finalSpeech = convo._speak.reduce((acc, text) => acc.sentence(text), new Say()).toString().trim();
		let promises = [];
		let textWasPopulated = !!(finalText || finalSpeech);

		let isRunningInDialogFlow = typeof convo.conv[action] === 'function';
		let convoFunc = isRunningInDialogFlow ? obj => convo.conv[action](obj) : resp => {
			if (options.log) {
				if (options.logFunc) {
					options.logFunc(action, resp);
				}
				else {
					console.log(`${action}:${JSON.stringify(resp, null, 1)}`);
				}
			}
		};

		if (textWasPopulated) {
			promises.push(convoFunc(Convo.SimpleResponse({
				text: finalText || finalSpeech,
				speech: finalSpeech || finalText
			})));
		}

		convo._rich.forEach((richResponse) => {
			if (richResponse.media && !richResponse.capabilities && !richResponse.send) {
				promises.push(convoFunc(richResponse.media));
				return;
			}
			if (convo.conv.surface && convo.conv.surface.capabilities.has(richResponse.capabilities)) {
				if (!textWasPopulated && richResponse.send && (typeof richResponse.media !== 'string')) {
					promises.push(convoFunc(Convo.SimpleResponse({
						text: richResponse.send.notification,
						speech: richResponse.send.notification
					})));
				}
				promises.push(convoFunc(richResponse.media));
			}
			else if (richResponse.send && convo.conv.available && convo.conv.available.surfaces.capabilities.has(richResponse.capabilities)) {
				promises.push(convoFunc(Convo.NewSurface(
					{
						context: richResponse.send.context,
						notification: richResponse.send.notification,
						capabilities: richResponse.capabilities
					}
				)));
			}
		});

		return isRunningInDialogFlow ? Promise.all(promises) : Promise.all(promises).then(() => convo);
	}

	/* eslint-enable new-cap */
	static prepComplete(obj, action = 'close', options) {
		if (isPromise(obj)) {
			return obj.then(result => this.prepComplete(result, action, options));
		}

		return this.complete(obj, action, options);
	}

	static ask(obj, options) {
		return this.prepComplete(obj, 'ask', options);
	}

	static close(obj, options) {
		return this.prepComplete(obj, 'close', options);
	}

	constructor(obj) {
		this.conv = !obj ? Convo.mockConv() : obj.conv || obj;
		this.clear();
	}

	clear() {
		this._write = [];
		this._speak = [];
		this._rich = [];
		return this;
	}

	write(message) {
		this._write.push(message.toString());
		return this;
	}

	speak(message, writeAlso = true) {
		this._speak.push(message.toString());
		if (writeAlso) {
			this.write(message);
		}
		return this;
	}

	present(media, capabilities = null, send = null) {
		this._rich.push({ capabilities, send, media });
		return this;
	}

	/**
 * Guaranteen that func returns a promise
 * @param {Function} func
 */
	promise(func) {
		return Promise.resolve().then(() => func(this) );
	}

	setAccessToken(token) {
		if (!this.conv.user) {
			this.conv.user = {};
		}
		if (!this.conv.user.access) {
			this.conv.user.access = {};
		}
		this.conv.user.access.token = token;
		return this;
	}

	getContext(context) {
		let rContext;
		if (this.conv && this.conv.contexts) {
			rContext = this.conv.contexts.get ? this.conv.contexts.get(context) : this.conv.contexts[context];
		}
		return rContext && rContext.parameters || {};
	}

	setContext(context, lifespan, parameters) {
		if (this.conv && this.conv.contexts) {
			if (this.conv.contexts.set) {
				this.conv.contexts.set(context, lifespan, parameters);
			}
			else {
				this.conv.contexts[context] = { lifespan, parameters };
			}
		}
		return this;
	}

	getStorage() {
		return this.conv && this.conv.user && this.conv.user.storage || {};
	}
}

function isPromise(obj) {
	return !!(obj && obj.then);
}

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


module.exports = { Say, Convo, ConvoApp };
