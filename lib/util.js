var readline = require('readline');
var request = require('request');
var querify = require('qs').stringify;
var colors = require('colors');
var debug = true;

request = request.defaults({jar: true});

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function hidden(query, callback) {
    var stdin = process.openStdin();
    var onDataHandler = function(char) {
        char = char + "";
        switch (char) {
          case "\n": case "\r": case "\u0004":
            // Remove this handler
            stdin.removeListener("data",onDataHandler); 
            break;//stdin.pause(); break;
          default:
            process.stdout.write("\033[2K\033[200D" + query);
          break;
        }
    };

    process.stdin.on("data", onDataHandler);

    rl.question(query, function(value) {
      rl.history = rl.history.slice(1);
      callback(value);
    });
}

function question(query, callback) {
    var stdin = process.openStdin();
    var onDataHandler = function(char) {
        char = char + "";
        switch (char) {
          case "\n": case "\r": case "\u0004":
            // Remove this handler
            stdin.removeListener("data",onDataHandler); 
            break;//stdin.pause(); break;
          default:
            process.stdout.write("\033[2K\033[200D" + query + rl.line);
          break;
        }
    };

    process.stdin.on("data", onDataHandler);

    rl.question(query, function(value) {
      rl.history = rl.history.slice(1);
      callback(value);
    });
}

module.exports = {

  getenv: function(env, def) {
    if(process.env[env]){
      return process.env[env];
    }
    return def;
  },

  debug: function () {
    if(debug){
      for(var i = 0; i < arguments.length; i++){
        if(typeof arguments[i] === 'string'){
          arguments[i] = arguments[i].cyan;
        }
      }
      console.log.apply(console, arguments);
    }
  },

  error: function () {
    for(var i = 0; i < arguments.length; i++){
      if(typeof arguments[i] === 'string'){
        arguments[i] = arguments[i].red;
      }
    }
    console.log.apply(console, arguments);
  },

  getpassword: hidden,

  question: question,

  getRequest: function(url, headers, cb){
    if(typeof headers === 'function') {
      cb = headers;
      headers = undefined;
    }
    request.get({
      url: url,
      headers: headers
    }, cb);
  },

  postRequest: function(url, headers, data, cb){
    request.post({
      url: url,
      headers: headers,
      body: querify(data)
    }, cb);
  }

};