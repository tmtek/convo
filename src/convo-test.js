
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
	static containsSpokenText(requests, pattern) {
		if (!requests) {
			throw new Error('Requests were not supplied.');
		}
	
		return requests
			.filter(request => request.payload.type === 'SimpleResponse')
			.map(request => {
				return!pattern ? 
				request.payload.data.speech
				:
				 new RegExp(pattern).test(request.payload.data.speech)
			})
			.filter(val => val)
			.length > 0;
	}
	static containsWrittenText(requests, pattern) {
		if (!requests) {
			throw new Error('Requests were not supplied.');
		}
		return requests
			.filter(request => request.payload.type === 'SimpleResponse')
			.map(request => {
				return!pattern ? 
				request.payload.data.text
				:
				 new RegExp(pattern).test(request.payload.data.text)
			})
			.filter(val => val)
			.length > 0;
	}
}

module.exports = { ConvoTest };
