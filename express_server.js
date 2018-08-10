// Requirements
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

// Databases
const urlDatabase = require('./Databases/urlDb.js');
const users = require('./Databases/userDb.js');

// Creates server with given port
const app = express();
const PORT = 8080; // default port 8080
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});

// Middleware to parse body of POST request
app.use(bodyParser.urlencoded({extended: true})); 

// Encrypt cookies
app.use(cookieSession({
  name: 'user_id',
  keys: ['lighthouse', 'tiny', 'url'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// HELPER FUNCTIONS
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

// Given email input, returns user id if it exists in database
function userEmailCheck(input) {
  for (user in users) {
    if (users[user].email === input) {
      return users[user].id;
    }
  }
  return false;
}

// Home page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// Register page
app.get("/register", (req, res) => {
  let templateVars = { userObj: users[req.session.user_id] };
  res.render('register', templateVars);
});

// Register POST - Updates user database with input information and adds userID cookie
app.post("/register", (req, res) => {
  if (!req.body.password || !req.body.email) { // Checking there isn't input of empty string
    res.redirect(400, "/register");
  } else if (userEmailCheck(req.body.email)) { // Checking users database doesn't already have email
      res.redirect(400, "/register");    
  } else {
      let userID = generateRandomString();
      users[userID] = {
        id: userID, 
        email: req.body.email, 
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.user_id = userID;
      res.redirect('/urls');
    }; 
});

// Login page
app.get("/login", (req, res) => {
  let templateVars = {
    userObj: users[req.session.user_id]
  };
  res.render('login', templateVars)
});

// Login POST -  Stores username input as cookie and redirects user to /urls
app.post("/login", (req, res) => {
  if (!userEmailCheck(req.body.email)) { 
    res.redirect(400, "/login");
    return;
  }
  let user = userEmailCheck(req.body.email)
  if (!bcrypt.compareSync(req.body.password, users[user].password)) {
    res.redirect(400, "/login");
    return;
  }
  let id = userEmailCheck(req.body.email);
  req.session.user_id = id;
  res.redirect('/urls');
});

// Displays current directory of shortened links and link to shorten a new one
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase, 
    userObj: users[req.session.user_id]
  };
  res.render('urls_index', templateVars);
});

// Short url generator page
app.get("/urls/new", (req, res) => {
  let templateVars = { 
    userObj: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

// Displays short and long URL
app.get("/urls/:id", (req, res) => {
  if (!urlDatabase.hasOwnProperty(req.params.id)) {
    res.redirect(404, '/login')
    return;
  }
  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    let templateVars = {
      urls: urlDatabase[req.params.id],
      userObj: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    let templateVars = { userObj: users[req.session.user_id] }
    res.render('denied', templateVars);
  } 
});

// Takes in user input, adds new random URL and redirects client
app.post("/urls", (req, res) => {
  let shortenedString = generateRandomString();
  var todayDate = new Date().toISOString().slice(0,10);
  urlDatabase[shortenedString] = { 
    shortURL: shortenedString, 
    longURL: req.body.longURL, 
    userID: req.session.user_id,
    date: todayDate
  };
  res.redirect(303, `http://localhost:8080/urls/${shortenedString}`);
});

// Updates long url
app.post("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    var todayDate = new Date().toISOString().slice(0,10);
    let link = req.params.id;
    urlDatabase[link] = {
      shortURL: link, 
      longURL: req.body.longURL, 
      userID: req.session.user_id,
      date: todayDate
    };
    res.redirect('/urls');
  } else {
    res.redirect('/urls');
  }
});

// Deletes link of choice and redirects to url page
app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session.user_id) {  
    let link = req.params.id;
    delete urlDatabase[link];
    res.redirect(303, 'http://localhost:8080/urls');
  } else {
    let templateVars = { userObj: users[req.session.user_id] };
    res.render('denied', templateVars);
  }
});

// Checks if shortened URL is valid, and redirects to it if so
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase.hasOwnProperty(req.params.shortURL)) {
    res.redirect(404, 'http://localhost:8080');
  } else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(302, longURL);
  }
});

// Logs user out, clears cookies, redirects to urls page
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});
