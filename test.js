const {Convo} = require(`./index`);

Convo.ask(
	new Convo().speak("statement 1")
	.promise(convo => Promise.resolve("data").then(response =>
		convo.speak(`statement 2 ${response}`)
	))
	.then(convo =>
		convo.speak("statement 3")
	),
	{log:true}
)
