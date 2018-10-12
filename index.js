const {
  SimpleResponse,
  NewSurface
} = require('actions-on-google');

function isPromise(obj) {
  return obj['then'];
}

function isNotEmpty(str) {
  return str && str.trim() !== "";
}

class Say {

  static append(val) {
    return new Say().append(val);
  }

  static sentence(val) {
    return new Say().sentence(val);
  }
  constructor() {
    this.str= "";
  }

  append(val) {
    this.str += val;
    return this;
  }

  newline() {
    return this.append("\n");
  }

  paragraph() {
    return this.newline().newline();
  }

  sentence(val) {
    return this.append(" ").append(val);
  }

  toString() {
    return this.str.trim();
  }
}

class Convo {

  static complete(convo, action = "close") {
    if(!convo.conv){
      console.log(`${action}:${JSON.stringify(convo, null, 1)}`)
    } else {
      let final_text = convo._write.reduce((acc, text) => acc.sentence(text), new Say()).toString();
      let final_speech = convo._speak.reduce((acc, text) => acc.sentence(text), new Say()).toString();
      let promises = [];
      let textIsNotEmpty = isNotEmpty(final_text);
      let speechIsNotEmpty = isNotEmpty(final_speech);
      let textWasPopulated = textIsNotEmpty || speechIsNotEmpty;

      if (textWasPopulated) {
        promises.push(convo.conv[action](new SimpleResponse({
          text : textIsNotEmpty ? final_text : final_speech,
          speech: speechIsNotEmpty ? final_speech : final_text
        })));
      }

      convo._rich.forEach((richResponse) => {
        if (!richResponse.media) {
          promises.push(convo.conv[action](richResponse));
          return;
        }
        if (convo.conv.surface && convo.conv.surface.capabilities.has(richResponse.capabilities)) {
          if (!textWasPopulated && richResponse.send && (typeof richResponse.media !== "string")) {
            promises.push(convo.conv[action](new SimpleResponse({
              text : richResponse.send.notification,
              speech: richResponse.send.notification
            })));
          }
          promises.push(convo.conv[action](richResponse.media));
        } else if (richResponse.send && convo.conv.available && convo.conv.available.surfaces.capabilities.has(richResponse.capabilities)) {
          promises.push(convo.conv[action](
            new NewSurface({
              context: richResponse.send.context,
              notification: richResponse.send.notification,
              capabilities: richResponse.capabilities
            })
          ));
        }
      });
      return Promise.all(promises);
    }
  }
  static prepComplete(obj, action = "close") {
    if (isPromise(obj)) {
      obj.then(convo => this.complete(convo, action));
    } else {
      return this.complete(obj, action);
    }
  }
  static ask(obj) {
    return this.prepComplete(obj, "ask");
  }
  static close(obj) {
    return this.prepComplete(obj, "close");
  }

  constructor(conv) {
    this.conv = conv;
    this._write = [];
    this._speak = [];
    this._rich = [];
  }
  write(message) {
    this._write.push(message.toString());
    return this;
  }
  speak(message, writeAlso = true) {
    this._speak.push(message.toString());
    if (writeAlso) {
      this.write(message);
    }
    return this;
  }
  present(media, capabilities = null, send = false) {
    this._rich.push({capabilities, send, media});
    return this;
  }
  decorate(func) {
    let r = func(this);
    if (!isPromise(r)) {
      return Promise.resolve(r);
    }
    return r;
  }
}

module.exports = {Say, Convo};
