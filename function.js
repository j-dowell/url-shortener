// HELPER FUNCTIONS
// Returns a string of 6 random characters
var exports = module.exports;

exports.generateRandomString = function() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    const stringLength = 6;
    let stringResult = '';
    for (let i = 0; i < stringLength; i++) {
      let num = Math.floor(Math.random() * chars.length);
      stringResult += chars[num];
    }
    return stringResult;
  }
  
// Returns current month/day/year
exports.dateMaker = function() {
    return new Date().toISOString().slice(0,10);
  }

  