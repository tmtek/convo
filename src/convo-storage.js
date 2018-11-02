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
			if (!this._filename) {
				resolve({});
				return;
			}
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
		if (!this._filename) {
			return;
		}
		fs.writeFile(this._filename, JSON.stringify(storage, null, 2), error => {});
	}
}

module.exports = { ConvoStorage };
