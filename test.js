const {Convo, ConvoApp} = require(`./index`);

class MyApplication extends ConvoApp {

    onRegisterIntents() {

      this.registerIntent('welcome', (convo, params, option, debug) => {
        return Convo.ask(convo.speak("Welcome to my application!"), debug);
      });

      this.registerIntent('my_fav_color', (convo, params, option, debug) => {
        return Convo.ask(
          convo
            .speak("my favorite color is red.")
            .speak("What is your favorite color?"),
          debug
        );
      });

      this.registerIntent('your_fav_color', (convo, {color}, option, debug) => {
        return Convo.ask(
          convo.speak(`${color} is an amazing choice!`),
          debug
        );
      });
    }
}


new MyApplication()
  //User starts your application, and you respond:
  .intent(new Convo(), 'welcome', null, null, {log:true})

  //User asks for your favorite color:
  .then(({app, convo}) =>
    app.intent(new Convo(convo), 'my_fav_color', null, null, {log:true})
  )

  //User responds with "blue":
  .then(({app, convo}) =>
    app.intent(new Convo(convo), 'your_fav_color', {color:"green"}, null, {log:true})
  );
