# Convo

Convo is a javascript library for building, testing and deploying conversational fulfillments for [DialogFlow](https://dialogflow.com/). Convo allows you to build and test a complete application as a simple Node project, then bind that same application to a DialogFlow app in a fulfillment for testing in the production enviornment.

Convo separates your working application's code completely from all DialogFlow dependencies and scaffolding so that you can develop and test with maximum freedom and agility.

### Installation

`npm i @tmtek/convo`

### Topics:

* ConvoApp
* DialogFlow Fulfillments
	* About Class Mappings
* Responding with Convo
	* Responding to an Intent
	* Composing Responses
	* Async Operations
* Development And Testing
	* Simulating Conversations
* API Reference
* Advanced Topics
	* Using Storage
	* Handling Lists
	* Help


## Convo App

Convo applications require you to encapsulate your DialogFlow intent callbacks in a class wrapper that facilitates their execution outside of the DialogFlow scaffolding:

```javascript
const {ConvoApp, Convo} = require(`@tmtek/convo`);

//Define your Convo application:
class MyApplication extends ConvoApp {
	//Register all of your DialogFlow intents:
	onRegisterIntents() {
		this.registerIntent('welcome', (convo, params, option, debug) =>
			Convo.ask(convo.speak("Welcome to my application!"), debug);
		);
	}
}

//Instantiate you application for test:
new MyApplication()
  //Simulate user triggering your welcome intent:
  .intent(new Convo(), 'welcome', null, null, {log:true});

```

The advantage here is that I can run and test my application by simply executing this application with Node.

## DialogFlow Fulfillments

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

#### About Class Mappings

Convo keeps all DialogFlow related scaffolding and dependencies out of your dev and test enviornment. One of the things it needs to keep out, is the classes DialogFlow uses to wrap responses. Convo offers methods you can use build rich responses, but they are mapped just in time to their DialogFlow counterparts with the help of the method `ConvoApp.setClassMappings()`:

```javascript
const {
  dialogflow,
  SignIn,
  SimpleResponse,
  BasicCard,
  List,
  Button,
  Image,
  NewSurface
} = require('actions-on-google');
const functions = require('firebase-functions');
const {MyApplication} = require('myapplication');

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  new MyApplication()
    .setClassMappings({
      SignIn: obj => new SignIn(obj),
      SimpleResponse: obj => new SimpleResponse(obj),
      NewSurface: obj => new NewSurface(obj),
      BasicCard: obj => new BasicCard(obj),
      List: obj => new List(obj),
      Button: obj => new Button(obj),
      Image: obj => new Image(obj)
    })
    .bind(dialogflow({debug: true}))
);

```
In the above fulfillment example, Your application is mapping all of the rich response classes just before binding to the DialogFlow application. 

**You only need to bind the classes you are actually using, and SimpleResponse must always be bound.**

These mappings are expressed in your application when you utilize the methods fir Rich responses like so:

```javascript
Convo.ask(Convo.SignIn());
Convo.ask(Convo.BasicCard{title:"My card"});
//etc

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
this.registerIntent('welcome', (convo, params, option, debug) =>
	Convo.ask(convo.speak("Welcome to my application!"), debug);
);
``` 

A response must ALWAYS return the result of either `Convo.ask(convo)` or `Convo.close(convo)`, but you are free to decorate your convo instance in whatever way you need to.

### Composing responses:

Responses to the end user are composed using 3 main methods. All of the following methods return a self reference to facilitate chaining for ease of use:

#### convo.speak(message, alsoWrite=true)

This method produces a spoken response to the end user, and by default will also write the response if a screen is available on the device your app is running on. If `alsoWrite` is set to false, the written response will not be produced.

You may call `.speak()` as many times as you need to to compose your response. Convo will compile all of your calls together into one block of text when it submits it to DialogFlow.

#### convo.write(message)

This method will write text on the screen if one is available on the device your app is running on, otherwise it is ignored. This text is never spoken.

#### convo.present(media, requiredCapabilities, send)

This method allows you to display rich responses to the end user, as well as other special user interactions facilitated by DialogFlow:

##### Supported Media Types:

* Convo.SignIn({})
* Convo.SimpleResponse({})
* Convo.NewSurface({})
* Convo.BasicCard({})
* Convo.List({})
* Convo.Button({})
* Convo.Image({})

##### Sending Rich Responses

If your application is runnign on a device that does not support the capabilities required to render the media, you can use `send` to request that the media be pushed to another device that can render it if the user has another device that supports it.


### Async Operations for a Convo Response:

Convo instances have a `.promise()` method that allow you to perform async work and apply that result to the existing convo object:

```javascript
this.registerIntent('welcome', (convo, params, option, debug) => 
	Convo.ask(
		convo.speak("Welcome to my application!")
			.promise(() => 
				someAsyncThing()
				.then(response => 
					convo.speak(`Hey I found this:${response}`)
				)
			), 
		debug
	);
);
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

* new Convo(convo)
* new Convo(conv)
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

#### Convo Storage
* getStorage()
* setStorage(data)
* setToStorage(name, data)
* getFromStorage(name)
* isInStorage(name, predicate)

#### Convo Lists
* setList(type, list, paging = { start: 0, count: -1 })
* forListPage(({convo, page,list}) => {})
* updateListPaging(paging = { start: 0, count: -1 })
* nextListPage(count = -1)
* prevListPage(count = -1)

#### Convo Rich Responses
* Convo.SimpleResponse()
* Convo.BasicCard()
* Convo.List()
* Convo.Image()
* Convo.Button()
* Convo.NewSurface()
* Convo.SignIn()

#### ConvoStorage
* new ConvoStorage(filename)
* .load(convo => {})


# Advanced Topics

## Using Storage

Convo allows you to simulate DialogFlow's storage capabilities. Storage lets you store arbitrary data for the user that is accessible across sessions of usage. Convo offers methods to simply interaction with storage, but to also simulate it in the dev/test environment.

```javascript
let convo = new Convo()
	.onStorageUpdated(storage => {console.log(storage)}) //fires after setToStorage call.
	.setStorage({}) //populates storage with data (doesn't trigger onStorageUpdated).
	.setToStorage("list", ["one","two","three"]); //Add value to storage.

convo.isInStorage("list", list => list.length > 0); //returns true
convo.getFromStorage("list"); //returns ["one","two","three"]

```

`setToStorage()`, `getFromStorage()`, and `isInStorage()` will be the methods that are most commonly used in application development.

`onStorageUpdated()` and `setStorage()` are useful when testing your application outside of DialogFlow, because you can use those methods to simulate persisted data, or actually persist it yourself.

#### ConvoStorage

There is a utility included with Convo that you can use to create a Convo object that has it's storage populated from a json file and will also write any changes made to storage to that file:

```javascript
const {ConvoStorage} = require('@tmtek/convo');

new ConvoStorage("storage.json").load(storageConvo => {
	new YourApp().intent(storageConvo, 'welcome', null, null, {log:true});
});
```

The ConvoStorage class allows you to specify a json file to load your data from. Then you call `load(convo=> {})` to get a Convo object generated for that storage data. If your application uses `setToStorage()` thereafter, the data will be automatically saved to that json file.

## Handling Lists:

Lists are challenging to manage in a conversational application. Long lists cannot be presented to a user in their entireity because you risk overwhelming the user with too much information and too many options. 

A great conversational list experience allows the user to step through a list in easy to digest pages, and select items out of those pages. The application must persist the list and the cursor state through context so that the user can interact with the list in a series of requests and responses.

Convo offers a toolkit to simplify presenting lists to the end user, offering features such as context-based persistence, list paging, and list item selection.

When managing lists with Convo there are a few assumptions the framework makes in the spirit of user experience and usability:

* Only one list is being presented to the user at a time.
* List items will be presented in digestible pages to avoid overwhelming the user with information and options.
* User will be able to make selections from any page presented to them, and that selection options will always be in relation to the current page.

```javascript
let list = [
	'list item 0', 
	'list item 1', 
	'list item 2', 
	'list item 3', 
	'list item 4'
];

Convo.ask(new Convo()
	.speak("Here's your list:")
	.setList("general", list, { start: 0, count: 3 })
	.forListPage(({ convo, page }) => {
		page.forEach(item => {
			convo.speak(item);
		});
	});
);

```

### setList()

`convo.setList()` can be called at any time to have convo start managing a list for presentation. The full signature of the method is:

`setList(type, list, paging = { start:0, count:5 })`

**type**: An identifier use to distinguish this list from others. When rendering a list, or list items, this type parameter can be used to figure out how to render the items.

**list**: An array of objects that you want to start managing as the list to be presented to the user.

**paging**: set the paging rules by default for this list. The paging object has a `start` value that specifies what index to start the paging at. `count` is the amount of items in each page.

### forListPage()

`convo.forListPage()` can be used at any time to render the state of the list into a Convo response. You must supply a function to this method that receives a listState object, and allows you to handle the result like so:

```javascript

.forListPage(({ convo, page, list, type}) => {
	convo.speak(`Rendering page from list of type ${type}:`);
	page.forEach(item => {
		convo.speak(`${item},`);
	});
	convo.speak(` and ${list.length - page.length} other items.`);
});

``` 

### List control methods:

There are other methods you can use to control the state of the list:

* `updateListPaging(paging = { start: 0, count: -1 })` : allows you to specifically reset the start index and page count for the list. -1 for count signifies all items.
* `updateList(list)`: Change the contents of the current list and use this method to update it, but maintain all other list state.
* `nextListPage(count = -1)`: Increments the current list page based on it's default paging values. Passing a number as the first argument will change the page count.
* `prevListPage(count = -1)` : Decrements the current list page based on it's default paging values. Passing a number as the first argument will change the page count.
* `clearList()`: Removes the current list from the conversational context.
* `hasList()`: returns true if a list is being managed by this Convo instance.

### Selecting Items from a List:

Most list interations will involve being presented with a list of things, and then selecting something from that list for more detailed information and new options related to that item. Convo supports many way to select items from a list.
 
* forListSelection({convo, item, type})
* selectFromListPage(index = 0)
* selectFromList(index = 0)
* selectFromListByQuery(query, testFunc = (type, item, query) => false)
* getListSelection()
* forListSelection(listSelectionData => {})
* clearListSelection()
* hasListSelection()
* selectNextFromList()
* selectPrevFromList()

### ConvoApp List Implementation

ConvoApp has built-in intent handlers for handling standard list management and selection operations. You can activate these handlers by calling `registerListIntents()` in your `onRegisterIntents()` method. These methods will only be utilized if you have defined the DialogFlow List Intents required to drive the implementation, and those a described in detail in the next section.

```javascript
class MyApplication extends ConvoApp {

	onRegisterIntents() {
		//register all of the built-in list intent handlers:
		this.registerListIntents();
	}

	/*
	This method is called anytime the current state of the 
	list needs to be rendered and sent to the end user.
	*/
	onRespondForList({ convo, type, page, list }) {
		return convo;
	}

	/*
	This method is called anytime the current slected item 
	needs to be rendered and sent to the end user.
	*/
	onRespondForListSelection({ convo, type, item }) {
		return convo;
	}
	
	/*
	This method is called for each list item when the user 
	is searching the list by query. Return true if you think
	the query matches the item.
	*/
	onQueryListForSelection(type, item, query) {
		return false;
	}
}
```


#### ConvoApp List Intents:

A ConvoApp expects that if you are using the built-in list intent fulfillments, that you have defined the intents for your application in DialogFlow. Here is a list of all of the intents you must define and the training statements you must define for each:

* list_all : The user is requesting to hear the entire list with no paging:
	* "list them all"
	* "read them all"
* list_next : The user wants the next list page:
	* "more"
	* "next page"
	* "3 more" <- where 3 is a number param called: `count`
* list_prev : The user is requesting the previous list page:
	* "previous page"
* list_select : The user wants to select an item from the current page by it's index in the current page. The index should be an ordinal param called `index`:
	* "Select the first one."
	* Pick the second.
* list\_select_next : The user wants to select the next item after the current one.
	* "next"
	*  "select next"
* list\_select_prev : The user wants to select the previous item before the current one.
	* "previous"
	* "select previous"
* list_find : The user is trying to select an item in the list by matching a spoken statement to one of the list items. This should submit a text param called `query`
	* "Select that one that contains {query}"
	* "Select {query}"

## Help

Conversational applications have no visual user interface (except rich responses), and creating affordances for all of the capabilities of an application can be impractical due to the potential for overwhelming the user with too much information.

Convo offers an opt-in browsable Help system that you can use to explain the capabilities of your application in detail. The help system allows you to define *topical categories*, and then fill those categories with *tips*.

### Topical Categories

Topical Categories represent high-level features of your application. For example, a shopping list app might have the following categories:

* Adding New Items.
* Navigating The List.
* Removing Items.

### Tips

Each Topical Category contains a list of Tips. Tips are just a quick explanation of something that the user of the application can do. Here is the first category from the list from above, but with tips added:

* Adding New Items.
	* You can add bananas to your shopping list by saying:"Add bananas to shopping list."
	* If you just say "Add", the shopping list will ask you what you would like to add to the shopping list.
	* If you specify a quantity, the shopping list will see this and adjust the quantity in your list automatically.
	* You can ask to add many items at once, and the shopping list will add them all individually for you.

### ConvoApp Help System

Here is an example of how you add all of your help content to your ConvoApp:

```javascript

class MyApp extends ConvoApp {

	onRegisterIntents() {
		this.registerListIntents();
		this.registerHelpIntent();
	}
	
	onPrepareHelp() {
		return [
			{
				description: 'Adding New Items.',
				tips: [
					{ text: 'You can add bananas to your shopping list by saying:"Add bananas to shopping list."' },
					{ text: 'If you just say "Add", the shopping list will ask you what you would like to add to the shopping list.' },
					{ text: 'If you specify a quantity, the shopping list will see this and adjust the quantity in your list automatically.' },
					{ text: 'You can ask to add many items at once, and the shopping list will add them all individually for you.' }
				]
			},
			{
				description: 'Navigating The List.',
				tips: [
					{ text: 'You can say "Read my shopping list" at any time to hear what\'s on the list.' },
					{ text: 'You can select any item in the list by it\'s position, for example "Select the first one".' },
					{ text: 'You can select any item by it\'s contents, for example "Select the bananas" and we will try to match you query with something in the list.' }
				]
			},
			{
				description: 'Removing Items',
				tips: [
					{ text: 'Once you have selected something in the list, you can say "Delete it", or "Got it" to remove it from the list.' },
					{ text: 'You can delete by position in the list by saying "Delete the second one".' }
				]
			}
		];
	}	
}

```

Help Content can be activated by the user at any time by them saying:

> "Help", "I need Some Help", or "What can I do?"

The Help System uses the Convo List system to present the Topical Categories to the user. User's can select categories in the Help list in the same way they would any other Convo list, and they will be presented with all of the tips for that category.
