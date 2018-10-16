# Convo

A javascript library for building, testing and deploying DialogFlow fulfillments easily.

## Installation

`npm i @tmtek/convo`

## The Basics

Here is basic Hello World example of a Convo response:

```
Convo.ask(new Convo()
	.write("Hello World in writing.")
	.speak("Saying Hello World!", false)
	.present(
		Convo.BasicCard({title:"Hello World on a Card."}),
		'actions.capability.SCREEN_OUTPUT'
	)
)
```

This response will do the following things when returned in a DialogFlow application:

1. Speak the phrase: "Saying Hello World!"
2. Print the text : "Hello World in writing." on the screen only if a screen is present.
3. Display a Card on screen that has the title "Hello World on a Card." only if a screen is present.

Convo compiles all of the response information you apply to it into one response that it sends to DailogFlow for presentation to the end user.

## Convo API

### Actions:
* Convo.ask(convo, debugOptions)
* Convo.close(convo, debugOptions)

### Methods:
* convo.write(text)
* convo.speak(text, alsoWrite = true)
* convo.present(media, capabilities, send)
* convo.promise(convo => {})
* convo.clear()
* convo.setAccessToken(token)
* convo.setConext(contextName, lifespan, value)
* convo.getContext(contextName)
* convo.getStorage()

### Rich Responses:
* Convo.SimpleResponse()
* Convo.BasicCard()
* Convo.List()
* Convo.Image()
* Convo.Button()
* Convo.NewSurface()
* Convo.SignIn()

### Config:
* Convo.setClassMappings(mappings)

## Development and Testing

Convo allows you take your application development out of the DialogFlow inline editor, and into your local enviornment to speed development up.

In a new Node Project, import Convo, and start composing Responses and testing them freely.

By specifying running the following in Node:

```
Convo.ask(
	new Convo().speak("How are you today?"),
	{log:true}
)
```

You will see this console output:

```
ask:{
 "type": "SimpleResponse",
 "data": {
  "text": "How are you today?",
  "speech": "How are you today?"
 }
}
```

The JSON above is a representation of the response data that will be sent to DialogFlow when this is running in a DialogFlow fulfillment.

### Debug Options

The DebugOptions object is a second argument you can supply to `Convo.ask()` or `Convo.close()`. It is only used while developing and testing applications.

```
{
	log:true,
	logFunc: (action, obj) => {}
}

```
* **log:** If log is set to true, the object being submitted to DialogFlow as a result of this ask or close will be printed as JSON.
* **logFunc:**  OPtionally supply your own function to log the object being debugged.



### Promises

Use the `promise()` method of Convo to build your response asyncronously. This method keeps your responses easy to read when a lot has to be done to build the response:

```
Convo.ask(
	new Convo().speak("How are you today?")
	.promise(convo => 
		asyncThing()
		.then(response => convo.speak(`I have this for you: ${response}`))
	)
)

```

Because `promise()` returns a promise, chained async operations will have to leverage `then()`:

```
Convo.ask(
	new Convo().speak("statement 1")
	.promise(convo => Promise.resolve("data")
		.then(response => 
			convo.speak(`statement 2 ${response}`)
		)
	)
	.then(convo => 
		convo.speak("statement 3")
	)
)

```

### Simulating Conversations

Many application interactions are comprised of a series of requests from the user. Convo supports simulating this by having the value returned from `Convo.ask()` be a Promise:

```
//User starts your application, and you respond:
Convo.ask(new Convo().speak("Welcome to my application!"))

//User asks for your favorite color:
.then(convo => 
	Convo.ask(new Convo(convo))
		.speak("my favorite color is red.")
		.speak("What is your favorite color?")
	)
)
//User responds with "blue":
.then(convo => 
	let color = "blue";
	Convo.close(new Convo(convo))
		.speak(`${color} is an amazing choice!`)
	)
)

```

This simulation capability is only for designing tests for your application outside of the DialogFlow enviornment. It allows you to simulate the flow in a controlled way, while carrying context through an interaction.

#### Designing your code in preparation for DialogFlow

Consider the following adaptation of the example above:


```
const MyApplication = {
	welcome: function(convo) {
		return convo
			.speak("Welcome to my application!");
	},
	myFavColor: function(convo) {
		return convo
			.speak("my favorite color is red.")
			.speak("What is your favorite color?");
	},
	yourFavColor: function(convo, color) {
		return convo
			.speak(`${color} is an amazing choice!`);
	}
}


//User starts your application, and you respond:
Convo.ask(MyApplication.welcome(new Convo()))

//User asks for your favorite color:
.then(convo => 
	Convo.ask(MyApplication.myFavColor(new Convo(convo)))
)

//User responds with "blue":
.then(convo => 
	Convo.close(MyApplication.yourFavColor(new Convo(convo), "blue"))
)

```

## Implementing a DialogFlow Fulfillment

When moving your code over to a DialogFlow fulfillment, all you need to know is that you must return the result of your `Convo.ask()` or `Convo.close()` function to the `app.intent()` function you are handling.

```
app.intent('my_intent', (conv, {yourParam}) => {
	return Convo.ask(new Convo(conv)
		.speak(`Your Param was ${yourParam}`)
	);
});

```

#### A Complete DialogFlow app:

If we were to map out a DialogFlow implementation of the app from the previous section, you would end up with something like this:

```
const {dialogflow} = require('actions-on-google');
const functions = require('firebase-functions');
const app = dialogflow({debug: true});
const {Convo} = require('@tmtek/convo');

const MyApplication = {
	welcome: function(convo) {
		return convo
			.speak("Welcome to my application!");
	},
	myFavColor: function(convo) {
		return convo
			.speak("my favorite color is red.")
			.speak("What is your favorite color?.");
	},
	yourFavColor: function(convo, color) {
		return convo
			.speak(`${color} is an amazing choice!`);
	}
}


app.intent('welcome', (conv) => {
	return Convo.ask(MyApplication.welcome(new Convo(conv)));
});

app.intent('my_fav_color', (conv) => {
	return Convo.ask(MyApplication.myFavColor(new Convo(conv)));
});

app.intent('your_fav_color', (conv, {color}) => {
	return Convo.close(MyApplication.yourFavColor(new Convo(conv), color));
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

```
