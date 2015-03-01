var Linkedin = require('./Linkedin');

module.exports = function(serviceName){
  serviceName = serviceName.toLowerCase();
  switch(serviceName) {
    case 'linkedin':
      return new Linkedin();
    default: 
      throw new Error('Service not implemented')
  }
};
