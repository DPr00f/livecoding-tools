var util = require('../util');
var _ = require('lodash');
var cheerio = require('cheerio');
var getpassword = util.getpassword;
var question = util.question;
var getenv = util.getenv;
var getRequest = util.getRequest;
var debug = util.debug;
var postRequest = util.postRequest;
var EventEmitter = require('events').EventEmitter;

module.exports = (function(){


  function setVar(whichVar, envVar, defaultVar, promptMessage, hidden, callback) {
    var _t = this;
    _t[whichVar] = getenv(envVar, defaultVar);
    if(!_t[whichVar]) {
      var p = getpassword;
      if(!hidden) {
        p = question;
      }
      p(promptMessage, function(answer){
        _t[whichVar] = answer;
        callback.call(_t);
      });
      return;
    }
    callback.call(_t);
  }

  function Linkedin(){}

  Linkedin.prototype = new EventEmitter();

  Linkedin.prototype.constructor = Linkedin;


  Linkedin.prototype.setLoginData = function(user, password) {
    setVar.call(this, 'user', 'LINKEDIN_USER', user, 'Linkedin user: ', false, function(){
      setVar.call(this, 'password', 'LINKEDIN_PASSWORD', password, 'Linkedin password: ', true, function(){
        debug('Setup is complete with user', this.user);
        this.emit('SETUP_COMPLETED');
      });
    });
  };


  Linkedin.prototype.authorizeApplication = function(response, body) {
    debug('Requesting authorization on url: ' + this.getLivecodingLoginUrl());
    getRequest.call(this, this.getLivecodingLoginUrl(), _.bind(this.executeServiceLogin, this));
  };

  Linkedin.prototype.executeServiceLogin = function(err, response, body) {
    this.referer = response.request.uri.href;
    var data = this.getAuthorizationData(response, body);
    var postTo = this.getAuthorizationUrl();
    var headers = this.getAuthorizationHeaders();
    debug('Making request to ', postTo);
    postRequest.call(this, postTo, headers, data, _.bind(this.gotoCallbackUrl, this));
  };

  Linkedin.prototype.getLivecodingLoginUrl = function() {
    return 'https://www.livecoding.tv/accounts/linkedin/login/';
  };

  Linkedin.prototype.gotoCallbackUrl = function(err, response, body) {
    var callbackUrl = response.headers.location;
    debug('Making request to callback url ', callbackUrl);
    getRequest.call(this, callbackUrl, {
      'Referer': this.referer
    }, _.bind(this.finishLogin, this));
  };

  Linkedin.prototype.finishLogin = function(err, response, body) {
    this.emit('SERVICE_LOGGED_IN', response, body);
  };

  Linkedin.prototype.getAuthorizationData = function(response, body) {
    $ = cheerio.load(body);
    var inputs = $('form[name="oauthAuthorizeForm"] input');
    var data = {};
    for(var i=0;i<inputs.length; i++){
      data[inputs[i].attribs.name] = inputs[i].attribs.value;
    }
    data['session_key'] = this.user;
    data['session_password'] = this.password;
    data['duration'] = 0;

    return data;
  };

  Linkedin.prototype.getAuthorizationUrl = function() {
    return 'https://www.linkedin.com/uas/oauth/authorize/submit';
  };

  Linkedin.prototype.getAuthorizationHeaders = function() {
    return {
      'content-type' : 'application/x-www-form-urlencoded',
      'Referer': this.referer,
      'Host': 'www.linkedin.com',
      'Origin': 'https://www.linkedin.com'
    };
  };

  return Linkedin;
})();