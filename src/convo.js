const { Say } = require('./say');

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
		this.conv = !obj ? Convo.mockConv() : this.copyConvo(obj);
		this.clear();
	}

	copyConvo(obj) {
		if (obj.conv) {
			this._onStorageUpdated = obj._onStorageUpdated;
			return obj.conv;
		}
		return obj;
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
	 * Guarantee that func returns a promise
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

	setStorage(data) {
		if (this.conv && this.conv.user) {
			this.conv.user.storage = data;
		}
		return this;
	}

	setToStorage(name, value) {
		if (this.conv && this.conv.user && this.conv.user.storage) {
			this.conv.user.storage[name] = value;
			if (this._onStorageUpdated) {this._onStorageUpdated(this.conv.user.storage);}
		}
		return this;
	}

	onStorageUpdated(callback) {
		this._onStorageUpdated = callback;
		return this;
	}

	getFromStorage(name) {
		if (this.conv && this.conv.user && this.conv.user.storage) {
			return this.conv.user.storage[name];
		}
		return null;
	}

	isInStorage(name, predicate = null) {
		return this.conv &&
		this.conv.user &&
		this.conv.user.storage &&
		this.conv.user.storage[name] &&
		(!predicate || predicate(this.conv.user.storage[name]));
	}

	setList(type, list, paging = { start: 0, count: -1 }){
		this.setContext('list', 1, {
			type,
			list,
			paging,
			selectedIndex: -1
		});
		return this;
	}

	clearList() {
		this.setContext('list', 0, null);
		return this;
	}

	hasList() {
		return this.getContext('list') && this.getContext('list').list;
	}

	updateListPaging(paging = { start: 0, count: -1 }){
		if (this.hasList()){
			this.getContext('list').paging = paging;
		}
		return this;
	}

	nextListPage(count = -1){
		let listContext = this.getContext('list');
		let newCount = count === -1 ? listContext.paging.count : count;
		let newIndex = listContext.paging.start + listContext.paging.count;
		if (newIndex >= listContext.list.length || newIndex < 0) {
			newIndex = 0;
		}
		this.updateListPaging({
			start: newIndex,
			count: newCount
		});
		return this;
	}

	prevListPage(count = -1){
		let listContext = this.getContext('list');
		let newCount = count === -1 ? listContext.paging.count : count;
		let newIndex = 0;
		if (listContext.paging.start <= 0) {
			newIndex = listContext.list.length - newCount;
		}
		else {
			newIndex = listContext.paging.start - listContext.paging.count;
			if (newIndex < 0) {
				newIndex = 0;
			}
		}
		this.updateListPaging({
			start: newIndex,
			count: newCount
		});
		return this;
	}

	forListPage(func) {
		if (this.hasList()){
			let listContext = this.getContext('list');
			let paging = listContext.paging;
			let count = paging.count < 0 ? listContext.list.length : paging.count;
			let page = listContext.list.slice(paging.start, Math.min(paging.start + count, listContext.list.length));
			func({ convo: this, page, list: listContext.list, type: listContext.type });
		}
		else {
			func({ convo: this });
		}
		return this;
	}

	selectFromList(index = 0){
		this.getContext('list').selectedIndex = index;
		return this;
	}

	selectFromListByQuery(query, findTextFunc = (item) => item){
		return this.forList(({ list }) => {
			let testedItems = list.map(item => {
				let test =  new RegExp(query.toLowerCase()).test(findTextFunc(item).toLowerCase());
				return test;
			});
			for (let i = 0; i<  testedItems.length; i++) {
				if (testedItems[i]) {
					this.selectFromList(i);
					break;
				}
			}
		});
	}

	forList(func){
		if (this.hasList()){
			let listContext = this.getContext('list');
			func({ convo: this, list: listContext.list, type: listContext.type });
		}
		else {
			func({ convo: this });
		}
		return this;
	}

	clearListSelected() {
		this.getContext('list').selectedIndex = -1;
		return this;
	}

	selectFromListPage(index = 0){
		let listContext = this.getContext('list');
		listContext.selectedIndex = listContext.paging.start + index;
		return this;
	}

	hasListSelected() {
		let listContext = this.getContext('list');
		return listContext && listContext.list && listContext.selectedIndex > -1;
	}

	forListSelected(func) {
		let listContext = this.getContext('list');
		let item = listContext.list[listContext.selectedIndex];
		func({ convo: this, item, type: listContext.type });
		return this;
	}

	selectNextFromList(){
		let listContext = this.getContext('list');
		listContext.selectedIndex = listContext.selectedIndex + 1 >= listContext.list.length ?
			0 : listContext.selectedIndex + 1;
		return this;
	}

	selectPrevFromList(){
		let listContext = this.getContext('list');
		listContext.selectedIndex =listContext.selectedIndex -1 < 0 ?
			listContext.list.length -1 : listContext.selectedIndex -1;
		return this;
	}

}

function isPromise(obj) {
	return !!(obj && obj.then);
}

module.exports={ Convo };
