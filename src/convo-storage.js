const fs = require('fs');
const { Convo } = require('./convo');

class ConvoStorage {
	constructor(filename) {
		if (!filename) {
			throw new Error('ConvoStorage requires a filename to write to.');
		}
		this._filename = filename;
	}

	load(callback) {
		return new Promise((resolve, reject) => {
			fs.readFile(this._filename, 'utf8', (error, data) => {
				!error ? resolve(JSON.parse(data)) : resolve({});
			});
		})
			.then(data => callback(
				new Convo()
					.setStorage(data)
					.onStorageUpdated(storage => this.write(storage))
			));
	}

	write(storage) {
		fs.writeFile(this._filename, JSON.stringify(storage, null, 2), error => {});
	}
}

module.exports = { ConvoStorage };
