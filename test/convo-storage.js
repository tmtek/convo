let { ConvoStorage } = require('../src/convo-storage');
let assert = require('assert');

describe('ConvoStorage', () => {
	it('Should instantiate with error if no filename is supplied.', () => {
		assert.throws(() => new ConvoStorage());
	});
	it('Should instantiate without error if filename is supplied.', () => {
		assert.doesNotThrow(() => new ConvoStorage('test-storage.json'));
	});
	it('Should start up with empty convo from non-existant file.', (done) => {
		new ConvoStorage('test-storage-doesntexist.json').load(convo => {
			convo ? done() : done(new Error('No Convo created.'));
		});
	});
	it('Should start populated convo from existing file.', (done) => {
		new ConvoStorage('./test/test-storage.json').load(convo => {
			if (convo && convo.isInStorage('test') && convo.getFromStorage('test') === 'test') {
				done();
			}
			else {
				done(new Error('No Convo created.'));
			}
		});
	});
	it('Should write changes to file.', (done) => {
		let timestamp = new Date().valueOf();
		new ConvoStorage('./test/test-storage-write.json').load(convo => {
			convo.setToStorage('timestamp', timestamp);
		}).then(() => {
			new ConvoStorage('./test/test-storage-write.json').load(convo => {
				assert(convo && convo.isInStorage('timestamp') && convo.getFromStorage('timestamp') === timestamp);
				done();
			}).catch(err => done(err));
		});
	});
});
