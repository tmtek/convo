# Convo

Convo is a javascript library for building, testing and deploying conversational fulfillments for [DialogFlow](https://dialogflow.com/). Convo allows you to build and test a complete application as a simple Node project, then bind that same application to a DialogFlow app in a fulfillment for testing in the production enviornment.

Convo separates your working application's code completely from all DialogFlow dependencies and scaffolding so that you can develop and test with maximum freedom and agility.

### Installation

`npm i @tmtek/convo`

## Convo App

Convo applications require you to encapsulate your DialogFlow intent callbacks in a class wrapper that facilitates their execution outside of the DialogFlow scaffolding:

```javascript
const {ConvoApp, Convo} = require(`@tmtek/convo`);

//Define your Convo application:
class MyApplication extends ConvoApp {
	//Register all of your DialogFlow intents:
	onRegisterIntents() {
		this.registerIntent('welcome', (convo, params, option, debug) => {
			return Convo.ask(convo.speak("Welcome to my application!"), debug);
		});
	}
}

//Instantiate you application for test:
new MyApplication()
  //Simulate user triggering your welcome intent:
  .intent(new Convo(), 'welcome', null, null, {log:true});

```

The advantage here is that I can run and test my application by simply executing this application with Node.

### DialogFlow Fulfillment

The application shown above can be published into a DialogFlow fulfillment by simply requiring the ConvoApp subclass you created in the fulfillment, and then binding it to the DialogFlow app as shown:


```javascript
'use strict';

const { dialogflow, SimpleResponse} = require('actions-on-google');
const functions = require('firebase-functions');
const {MyApplication} = require('myapplication');

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  new MyApplication()
    .setClassMappings({
      SimpleResponse: obj => new SimpleResponse(obj)
    })
    .bind(dialogflow({debug: true}))
);
```

## Responding with Convo

The core of the Convo library is the `Convo` class used to compose responses to the user's intents. Convo wraps DialogFlow's `conv` object, simulates all of it's capabilities outside of the DialogFlow scaffolding, and also provides simpler methods to compose complex responses.

Here is an illustration of it's basic use:

```javascript
Convo.ask(new Convo()
    .write("Hello World in writing.")
    .speak("Saying Hello World!", false)
    .present(
        Convo.BasicCard({title:"Hello World on a Card."}),
        'actions.capability.SCREEN_OUTPUT'
    )
)
``` 

This response will do the following things when returned from a registered intent in a `ConvoApp`:

* Speak the phrase: "Saying Hello World!"
* Print the text : "Hello World in writing." on the screen only if a screen is present.
* Display a Card on screen that has the title "Hello World on a Card." only if a screen is present.


Convo compiles all of the response information you apply to it into one response that it sends to DailogFlow for presentation to the end user. This is helpful because the standard `conv` object in DialogFlow can get confused when you are responding with multiple responses (text, speech and rich UI) and sometimes throw errors if you do not send them in the right order. Convo will take care of all of the required order of operations for you.


### Responding to an intent:

Convo responses will always be composed and returned in response to an intent registered in your `ConvoApp`:

```javascript
this.registerIntent('welcome', (convo, params, option, debug) => {
	return Convo.ask(convo.speak("Welcome to my application!"), debug);
});
``` 

A response must ALWAYS return the result of either `Convo.ask(convo)` or `Convo.close(convo)`, but you are free to decorate your convo instance in whatever way you need to.

### Async Operations for a Convo Response:

Convo instances have a `.promise()` method that allow you to perform async work and apply that result to the existing convo object:

```javascript
this.registerIntent('welcome', (convo, params, option, debug) => {
	return Convo.ask(
		convo.speak("Welcome to my application!")
			.promise(() => 
				someAsyncThing()
				.then(response => 
					convo.speak(`Hey I found this:${response}`)
				)
			), 
		debug
	);
});
``` 

`Convo.ask()` and `Convo.close()` will ensure that all work is completed on a Convo object before it submits itself to DialogFlow as a response.


## Development and Testing

When building your ConvoApp in a simple Node project, you can specify debug options to produce console output you can view for responses from all of your intents:

```javascript
new MyApplication()
	.intent(new Convo(), 'welcome', null, null, {log:true});

```
The `intent()` method of a ConvoApp allows you to simulate a call of an intent exactly as DialogFlow would trigger it. You may supply your own params (third argument) and options (fourth argument) if you desire.

The fifth argument is the `debugOptions`. This is unique to ConvoApp, and it allows you to generate console output for the response to the intent so you can see what's going on in development. When running in DailogFlow, debugOptions will always be null and not generate any output.

Here is what a debugOptions object offers:

```javascript
{
	log:true,
	logFunc:(action, response) => {}
}

```
If `log` is set to true, then the complete response object is reported in the console.

You may also supply an optional `logFunc` function, that can do anything you need to do with the response when it arrives. This could be useful for automated functional tests.

### Simulating Conversations:
`ConvoApp.intent()` allows us to simulate the invocation of intent, but it also returns a promise that can be used to simulate conversations with the end user:

```javascript 
new MyApplication()
	.intent(new Convo(), 'welcome', null, null, {log:true})
	.then(({app, convo}) => 
		app.intent(new Convo(convo), 'secondintent', null, null, {log:true})
	)
	.then(({app, convo}) => 
		app.intent(new Convo(convo), 'thirdintent', null, null, {log:true})
	);

```
We use`then()` of the resulting promises returned from `intent()` to simulate the multiple conversation steps. Notice how for each intent call we create a new instance of Convo derived from the previous: `new Convo(convo)`. This allows us to create a new response for each intent, but still carry over the context and storage data to simulate how things work in DialogFlow with a standard `conv` object.


## API Reference

### ConvoApp

* ConvoApp.setClassMappings(mappings);
* onRegisterIntents();
* registerIntent(intent, intentHandler);
* intent(convo, intent, params, option, debugOptions);
* bind(dialogflowapp);

### Convo

* Convo.ask(convo, debugOptions)
* Convo.close(convo, debugOptions)
* write(text)
* speak(text, alsoWrite = true)
* present(media, capabilities, send)
* promise(convo => {})
* clear()
* setAccessToken(token)
* setConext(contextName, lifespan, value)
* getContext(contextName)
* getStorage()

#### Convo Rich Responses
* Convo.SimpleResponse()
* Convo.BasicCard()
* Convo.List()
* Convo.Image()
* Convo.Button()
* Convo.NewSurface()
* Convo.SignIn()


