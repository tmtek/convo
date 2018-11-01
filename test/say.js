let { Say } = require('../src/say');
let assert = require('assert');

describe('Say', () => {
	describe('#ensureSentence', () => {
		it('Should add a trailing period if one is missing.', () => {
			let text = 'Hi, my name is Tony';
			assert(Say.ensureSentence(text) === `${text}.`);
		});
		it('Should not add a trailing period if one is present.', () => {
			let text = 'Hi, my name is Tony.';
			assert(Say.ensureSentence(text) === text);
		});
		it('Should not add a trailing period if other punctuation is present.', () => {
			assert(Say.ensureSentence('Hi, my name is Tony!') === 'Hi, my name is Tony!');
			assert(Say.ensureSentence('Hi, my name is Tony?') === 'Hi, my name is Tony?');
		});
	});
	describe('#listPageResponse', () => {
		it('Should output descriptive text for paged list items.', () => {
			let list = ['item 0', 'item 1', 'item 2', 'item 3', 'item 4', 'item 5', 'item 6'];

			let r1 = Say.listPageResponse(list.slice(0, 2), { start: 0, count: 2 }, list);
			assert(r1 === 'item 0, item 1 and 5 others.', r1);

			let r2 = Say.listPageResponse(list.slice(2, 4), { start: 2, count: 2 }, list);
			assert(r2 === 'item 2, item 3 and 3 others.', r2);

			let r3 = Say.listPageResponse(list.slice(4, 6), { start: 4, count: 2 }, list);
			assert(r3 === 'item 4, item 5 and 1 other.', r3);

		});
		it('Should output descriptive text for paged list items with map function.', () => {
			let list = [{ text: 'item 0' }, { text: 'item 1' }, { text: 'item 2' }, { text: 'item 3' }, { text: 'item 4' }, { text: 'item 5' }, { text: 'item 6' }];

			let r1 = Say.listPageResponse(list.slice(0, 2), { start: 0, count: 2 }, list, item => item.text);
			assert(r1 === 'item 0, item 1 and 5 others.', r1);

			let r2 = Say.listPageResponse(list.slice(2, 4), { start: 2, count: 2 }, list, item => item.text);
			assert(r2 === 'item 2, item 3 and 3 others.', r2);

			let r3 = Say.listPageResponse(list.slice(4, 6), { start: 4, count: 2 }, list, item => item.text);
			assert(r3 === 'item 4, item 5 and 1 other.', r3);

		});
	});

	describe('#listItems', () => {
		it('Should map a list to supported format by dialogflow with proper identifiers.', () => {
			let list = ['item 0', 'item 1', 'item 2', 'item 3', 'item 4', 'item 5', 'item 6'];
			let listItems = Say.listItems(list, (item) => ({
				title: item
			}), (item, i) => `listitem_${i}`);
			assert(listItems.listitem_0 && listItems.listitem_0.title === 'item 0');
			assert(listItems.listitem_1 && listItems.listitem_1.title === 'item 1');
			assert(listItems.listitem_2 && listItems.listitem_2.title === 'item 2');
			assert(listItems.listitem_3 && listItems.listitem_3.title === 'item 3');
			assert(listItems.listitem_4 && listItems.listitem_4.title === 'item 4');
			assert(listItems.listitem_5 && listItems.listitem_5.title === 'item 5');
			assert(listItems.listitem_6 && listItems.listitem_6.title === 'item 6');
		});
	});
});
