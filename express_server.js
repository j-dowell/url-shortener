// Requirements
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');


var PORT = 8080; // default port 8080

// Middleware to parse body of POST request
app.use(bodyParser.urlencoded({extended: true})); 
// app.use(cookieParser()); // Parsing cookies
app.use(cookieSession({
  name: 'user_id',
  keys: ['lighthouse', 'tiny', 'url'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

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
};

// Given email input, returns user id if it exists in database
function userEmailCheck(input) {
  for (user in users) {
    if (users[user].email === input) {
      return users[user].id;
    }
  }
  return false;
};

// Databases
var urlDatabase = { 
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "user2RandomID"
  },
  "9sm5xK": { 
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userID: 'user2RandomID' 
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "$2b$10$JK7guQEGyDtfghHW0VTXDu.M5/DkAoV6.eC1Sb0TUqNh/iomOxWdG"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "$2b$10$jKaVTzTzGzMf2/S72dm8rO1xJWow2VBLdsGLwx2Kg9JP8SeITRaaK"
  },
  "test123": {
    id: 'test123',
    email: "test@gmail.com",
    password: "$2b$10$DtGf4RU9cBJoP127zTEOyODl3XsGoUHF197FsLbjqgWYdZ31q20V2"
  }
};

// Home page
app.get("/", (req, res) => {
  res.end("Hello! Welcome to Tiny App");
});

// Register page
app.get("/register", (req, res) => {
  // let templateVars = { userObj: users[req.cookies["user_id"]] };
  let templateVars = { userObj: users[req.session.user_id] };
  res.render('register', templateVars)
});

// Login page
app.get("/login", (req, res) => {
  let templateVars = {
    // userObj: users[req.cookies["user_id"]]
    userObj: users[req.session.user_id]
  };
  res.render('login', templateVars)
});

// Login POST -  Stores username input as cookie and redirects user to /urls after handling input erros
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
  var id = userEmailCheck(req.body.email)
  // res.cookie('user_id', id);
  req.session.user_id = id;
  res.redirect('/urls');
});

// Register POST - Updates user database with input information and adds userID cookie
app.post("/register", (req, res) => {
  if (!req.body.password || !req.body.email) { // Checking there is not input of empty string
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
      // res.cookie('user_id', userID);
      req.session.user_id = userID;
      res.redirect('/urls');
    }; 
});

// Displays current directory of shortened links and link to shorten a new one
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase, 
    userObj: users[req.session.user_id]
    // userObj: users[req.cookies["user_id"]]
  };
  res.render('urls_index', templateVars);
});

// Link generator
app.get("/urls/new", (req, res) => {
  let templateVars = { 
    userObj: users[req.session.user_id]
    // userObj: users[req.cookies["user_id"]] 
  };
  res.render("urls_new", templateVars);
});

// Logs user out, clears cookies, redirects to urls page
app.post('/logout', (req, res) => {
  req.session = null;
  // res.clearCookie('user_id');
  res.redirect('/login');
});

// Takes in user input, adds new random URL and redirects client
app.post("/urls", (req, res) => {
  let shortenedString = generateRandomString();
  urlDatabase[shortenedString] = { 
    shortURL: shortenedString, 
    longURL: req.body.longURL, 
    userID: req.session.user_id
  };
  res.redirect(303, `http://localhost:8080/urls/${shortenedString}`);
});

// Deletes link of choice and redirects to url page
app.post("/urls/:id/delete", (req, res) => {
  let link = req.params.id;
  delete urlDatabase[link];
  res.redirect(303, 'http://localhost:8080/urls')
});

// Checks if shortened URL is valid, and redirects to it if so
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase.hasOwnProperty(req.params.shortURL)) {
    res.redirect(404, 'http://localhost:8080')
  } else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(301, longURL);
  }
});

// Updates long url
app.post("/urls/:id", (req, res) => {
  let link = req.params.id;
  urlDatabase[link] = {
    shortURL: link, 
    longURL: req.body.longURL, 
    // userID: req.cookies['user_id'] 
    userID: req.session.user_id
  };
  res.redirect('/urls/');
});

// Displays short and long URL
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    urls: urlDatabase[req.params.id],
    // userObj: users[req.cookies["user_id"]] 
    userObj: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

// Creates server with given port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
