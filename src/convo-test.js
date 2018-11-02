
class ConvoTest {
	static containsResponseType(requests, types) {
		if (!requests) {
			throw new Error('Requests were not supplied.');
		}
		if (!types || types.length === 0) {
			return false;
		}
		return types
			.map(type => requests.filter(request => request.payload.type === type).length > 0)
			.filter(typeVal => !typeVal)
			.length === 0;
	}
	static isConversationClose(requests) {
		return requests[0] && requests[0].action === 'close';
	}
	static testConversation(conversation, done) {
		if (!conversation || !conversation.then) {
			throw new Error('You must pass a conversational promise.');
		}
		if (!done) {
			throw new Error('You must pass a done function.');
		}
		let isDone = false;
		conversation.catch(err => {
			isDone = true;
			done(err);
		})
			.then(() => !isDone && done());
	}
}

module.exports = { ConvoTest };
