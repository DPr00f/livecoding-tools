var request = require('request');
var _ = require('lodash');
var cheerio = require('cheerio');

module.exports = (function(){
  function getenv(env, def) {
    if(process.env[env]){
      return process.env[env];
    }
    return def;
  }

  function keepProcessAlive(){
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function (data) {
      data = (data + '').trim().toLowerCase();
    });
  }

  function Livecoding(betaPassword, service) {
    console.log(getenv('LIVECODING_BETA_PASSWORD', betaPassword))
  }

  keepProcessAlive();
  
  return Livecoding;
})();