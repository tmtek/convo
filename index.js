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

  static mockConv() {
    return {
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
      },
      user:{
        access:{},
        storage:{}
      },
      contexts:{}
    }
  }
  static setClassMappings(mappings) {
    this._clsMappings = mappings;
  }

  static SignIn(obj) {
    if (this._clsMappings && this._clsMappings['SignIn']) {
      return this._clsMappings['SignIn'](obj);
    }
    return {type:"SignIn", data:obj};
  }
  static SimpleResponse(obj) {
    if (this._clsMappings && this._clsMappings['SimpleResponse']) {
      return this._clsMappings['SimpleResponse'](obj);
    }
    return {type:"SimpleResponse", data:obj};
  }
  static NewSurface(obj) {
    if (this._clsMappings && this._clsMappings['NewSurface']) {
      return this._clsMappings['NewSurface'](obj);
    }
    return {type:"NewSurface", data:obj};
  }
  static Image(obj) {
    if (this._clsMappings && this._clsMappings['Image']) {
      return this._clsMappings['Image'](obj);
    }
    return {type:"Image", data:obj};
  }
  static List(obj) {
    if (this._clsMappings && this._clsMappings['List']) {
      return this._clsMappings['List'](obj);
    }
    return {type:"List", data:obj};
  }
  static BasicCard(obj) {
    if (this._clsMappings && this._clsMappings['BasicCard']) {
      return this._clsMappings['BasicCard'](obj);
    }
    return {type:"BasicCard", data:obj};
  }
  static Button(obj) {
    if (this._clsMappings && this._clsMappings['Button']) {
      return this._clsMappings['Button'](obj);
    }
    return {type:"Button", data:obj};
  }

  static isPromise(obj) {
    return obj['then'];
  }
  static isNotEmpty(str) {
    return str && str.trim() !== "";
  }

  static complete(convo, action = "close", options = {log:false, logFunc: null}) {
    if(!convo.conv){
      if (options.log) {
          console.log(`${action}:${JSON.stringify(convo, null, 1)}`);
      }
      return Promse.resolve(convo);
    } else {
      let final_text = convo._write.reduce((acc, text) => acc.sentence(text), new Say()).toString();
      let final_speech = convo._speak.reduce((acc, text) => acc.sentence(text), new Say()).toString();
      let promises = [];
      let textIsNotEmpty = this.isNotEmpty(final_text);
      let speechIsNotEmpty = this.isNotEmpty(final_speech);
      let textWasPopulated = textIsNotEmpty || speechIsNotEmpty;

      let isRunningInDialogFlow = convo.conv[action] !== undefined;
      let convoFunc = isRunningInDialogFlow ? obj => convo.conv[action](obj) : resp => {
        if(options.log) {
          if (options.logFunc) {
            options.logFunc(action, resp);
          } else {
            console.log(`${action}:${JSON.stringify(resp, null, 1)}`);
          }
        }
      };

      if (textWasPopulated) {
        promises.push(convoFunc(Convo.SimpleResponse({
          text : textIsNotEmpty ? final_text : final_speech,
          speech: speechIsNotEmpty ? final_speech : final_text
        })));
      }

      convo._rich.forEach((richResponse) => {
        if (richResponse.media && !richResponse.capabilities && !richResponse.send) {
          promises.push(convoFunc(richResponse.media));
          return;
        }
        if (convo.conv.surface && convo.conv.surface.capabilities.has(richResponse.capabilities)) {
          if (!textWasPopulated && richResponse.send && (typeof richResponse.media !== "string")) {
            promises.push(convoFunc(Convo.SimpleResponse({
              text : richResponse.send.notification,
              speech: richResponse.send.notification
            })));
          }
          promises.push(convoFunc(richResponse.media));
        } else if (richResponse.send && convo.conv.available && convo.conv.available.surfaces.capabilities.has(richResponse.capabilities)) {
          promises.push(convoFunc(Convo.NewSurface(
            {
              context: richResponse.send.context,
              notification: richResponse.send.notification,
              capabilities: richResponse.capabilities
            }
          )));
        }
      });
      if (isRunningInDialogFlow) {
        return Promise.all(promises);
      } else {
        return Promise.all(promises).then(() => convo);
      }

    }
  }
  static prepComplete(obj, action = "close", options) {
    if (this.isPromise(obj)) {
      return obj.then(obj => this.prepComplete(obj, action, options));
    } else {
      return this.complete(obj, action, options);
    }
  }
  static ask(obj, options) {
    return this.prepComplete(obj, "ask", options);
  }
  static close(obj, options) {
    return this.prepComplete(obj, "close", options);
  }

  constructor(obj) {
    if (!obj) {
      this.conv = Convo.mockConv();
    } else {
      this.conv = obj.conv ? obj.conv : obj;
    }

    this.clear();
  }
  clear() {
    this._write = [];
    this._speak = [];
    this._rich = [];
    return this;
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
  present(media, capabilities = null, send = null) {
    this._rich.push({capabilities, send, media});
    return this;
  }
  promise(func) {
    let r = func(this);
    if (!Convo.isPromise(r)) {
      return Promise.resolve(r);
    }
    return r;
  }
  setAccessToken(token) {
    if (!conv.user) {
      conv.user = {};
    }
    if (!conv.user.access) {
      conv.user.access = {};
    }
    conv.user.access.token = token;
    return this;
  }
  getContext(context) {
    if (this.conv && this.conv.contexts) {
      var rContext;
      if (this.conv.contexts.get) {
        rContext = this.conv.contexts.get(context);
      } else {
        rContext = this.conv.contexts[context];
      }
      if (rContext && rContext.parameters) {
        return rContext.parameters;
      }
    }
    return {};
  }
  setContext(context, lifespan, parameters) {
    if (this.conv && this.conv.contexts) {
      if (this.conv.contexts.set) {
        this.conv.contexts.set(context, lifespan, parameters);
      } else {
        this.conv.contexts[context] = {lifespan, parameters};
      }
    }
    return this;
  }
  getStorage() {
    if (this.conv && this.conv.user && this.conv.user.storage) {
      return this.conv.user.storage;
    }
    return {};
  }
}

module.exports = {Convo, Say};
