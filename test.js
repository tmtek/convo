const {Say, Convo} = require(`./index`);


let mockConv = {
  ask:resp => console.log(`ask:${resp}`),
  close:resp => console.log(`close:${resp}`),
  surface:{
    capabilities:{
      has:() => true
    }
  },
  available:{
    surfaces:{
      capabilities:{
        has:() => true
      }
    }
  }
}

Convo.close(new Convo(mockConv)
  .write("Hey there.")
  .speak("This is a convo test.", false)
  .speak(Say
    .sentence("Just testing out a say.")
    .sentence("It makes complicated text responses easy to write.")
  )
  .present({title:"card"},'actions.capability.SCREEN_OUTPUT')
  .present({title:"another"},'actions.capability.SCREEN_OUTPUT')
  .decorate(convo =>
    new Promise(resolve => setTimeout(() => resolve(
      convo.speak("Made Additions on the outisde")
    ), 1000))
  )
  .then(convo => convo.speak("An after the fact addition"))
)
