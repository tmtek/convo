class Say {

	static ensureSentence(sentence) {
		if (!/[.!?]$/.test(sentence)) {
			return `${sentence}.`;
		}
		return sentence;
	}

	static listPageResponse(page, paging, list, textForItemFunc = item => item.toString(), delimiter = ', ') {
		if (!page || !list || page.length <= 0 || list.length <= 0) {
			return 'The list is empty.';
		}
		let textForItems = page.map(textForItemFunc).join(delimiter);
		if ((paging.start + page.length) < list.length) {
			let diff = list.length - (paging.start + page.length);
			textForItems += ` and ${diff} other${diff> 1 ? 's' : ''}.`;
		}
		return textForItems;
	}

	static listItems(items, mapFunc, itemNameFunc = (item, i) => `item_${i}`) {
		let inc = 0;
		return items
			.map(mapFunc)
			.reduce((accList, item) => {
				accList[itemNameFunc(item, inc++)] = item;
				return accList;
			}, {});
	}

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

	sentence(val) {
		return this.append(' ').append(val);
	}

	toString() {
		return this.str.trim();
	}
}

module.exports = { Say };
