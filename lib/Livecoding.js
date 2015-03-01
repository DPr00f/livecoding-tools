var _ = require('lodash');
var cheerio = require('cheerio');
var util = require('./util');
var debug = util.debug;
var error = util.error;
var getRequest = util.getRequest;
var postRequest = util.postRequest;
var getenv = util.getenv;
var Service = require('./services/Factory');
var EventEmitter = require('events').EventEmitter;

module.exports = (function(){
  var livecodingUrl = 'https://www.livecoding.tv/';

  function grabService(serviceName) {
    this.service = new Service(serviceName);
    this.service.on('SETUP_COMPLETED', _.bind(this.initialize, this));
    this.service.setLoginData();
  }

  function Livecoding(betaPassword, serviceName) {
    this.betaPassword = getenv('LIVECODING_BETA_PASSWORD', betaPassword);
    if(!this.betaPassword){
      util.getpassword("What's the livecoding.tv Beta Password? ", _.bind(function(password){
        this.betaPassword = password;
        grabService.call(this, serviceName);
      }, this));
      return;
    }
    grabService.call(this, serviceName);
  }

  Livecoding.prototype = new EventEmitter();

  Livecoding.prototype.constructor = Livecoding;

  Livecoding.prototype.initialize = function initialize() {
    debug('Initializing livecoding login.');
    getRequest.call(this, livecodingUrl + 'beta-login/', _.bind(this.grabCsrf, this));
  };

  Livecoding.prototype.grabCsrf = function grabCsrf(err, response, body) {
    var $ = cheerio.load(body);
    this.csrfToken = $("[action='/beta-login/'] [name='csrfmiddlewaretoken']").val();
    debug('Got token: ' + this.csrfToken);
    postRequest.call(this, livecodingUrl + 'beta-login/', {
      'content-type' : 'application/x-www-form-urlencoded',
      'Referer': 'https://www.livecoding.tv/beta-login/'
    }, {
      csrfmiddlewaretoken: this.csrfToken,
      password: this.betaPassword
    },
    _.bind(this.startServiceLogin, this));
  }

  Livecoding.prototype.startServiceLogin = function(err, response, body) {
    debug('Requesting service login');
    this.service.authorizeApplication(response, body);
    this.service.on('SERVICE_LOGGED_IN', _.bind(this.finishLogin, this));
  };

  Livecoding.prototype.finishLogin = function(response, body) {
    var $ = cheerio.load(body);
    if(body.indexOf('accounts/logout') > -1){
      debug('Logged in');
      this.channelUrl = $('.header-icons .main-navigationHover a')['0'].attribs.href;
      this.startChat();
    }else{
      error('Something wrong happened and it failed to login');
    }
  };

  Livecoding.prototype.startChat = function() {
    debug('Initializing chat');
  };
  
  return Livecoding;
})();