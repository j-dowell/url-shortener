// HELPER FUNCTIONS
let urlDatabase = require('./Databases/urlDb.js');
let users = require('./Databases/userDb.js');
exports = module.exports;

// Returns a string of 6 random characters
function generateRandomString() {
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
function dateMaker() {
    return new Date().toISOString().slice(0,10);
}

function userEmailCheck(input) {
    for (user in users) {
      if (users[user].email === input) {
        return users[user].id;
      }
    }
    return false;
  }
  
function addToURLDatabase(short, long, user, time) {
    urlDatabase[short] = {
        shortURL: short,
        longURL: long,
        userID: user,
        date: time
    };
  } 

  exports.generateRandomString = generateRandomString
  exports.dateMaker = dateMaker
  exports.userEmailCheck = userEmailCheck
  exports.addToURLDatabase = addToURLDatabase