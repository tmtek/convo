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

module.exports = { Say };
