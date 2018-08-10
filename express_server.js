// Requirements
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const helper = require('./function.js'); // helper functions

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
}));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Home page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// Register GET page
app.get("/register", (req, res) => {
  let templateVars = { userObj: users[req.session.user_id] };
  res.render('register', templateVars);
});

// Register POST - Updates user database with input information and adds userID cookie
app.post("/register", (req, res) => {
  if (!req.body.password || !req.body.email) { // Checking there isn't input of empty string
    res.redirect(401, "/register");
  } else if (helper.userEmailCheck(req.body.email)) { // Checking users database doesn't already have email
      res.redirect(401, "/register");    
  } else {
      let userID = helper.generateRandomString();
      users[userID] = {
        id: userID, 
        email: req.body.email, 
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.user_id = userID;
      res.redirect('/urls');
    }
});

// Login page
app.get("/login", (req, res) => {
  let templateVars = {
    userObj: users[req.session.user_id]
  };
  res.render('login', templateVars);
});

// Login POST -  Stores username input as cookie and redirects user to /urls
app.post("/login", (req, res) => {
  if (!helper.userEmailCheck(req.body.email)) { 
    res.redirect(401, "/login");
    return;
  }
  let user = helper.userEmailCheck(req.body.email);
  if (!bcrypt.compareSync(req.body.password, users[user].password)) {
    res.redirect(401, "/login");
    return;
  }
  let id = helper.userEmailCheck(req.body.email);
  req.session.user_id = id;
  res.redirect('/urls');
});

// urls table GET - Displays current directory of shortened links and link to shorten a new one
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase, 
    userObj: users[req.session.user_id]
  };
  res.render('urls_index', templateVars);
});

// urls POST - Takes in user input, adds new random URL and redirects client
app.post("/urls", (req, res) => {
  let shortenedString = helper.generateRandomString();
  var todayDate = helper.dateMaker();
  helper.addToURLDatabase(shortenedString, req.body.longURL, req.session.user_id, todayDate);
  res.redirect(303, `http://localhost:8080/urls/${shortenedString}`);
});

// urls/new GET - Short url generator page
app.get("/urls/new", (req, res) => {
  let templateVars = { 
    userObj: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

// Unique URL GET - Displays short and long URL
app.get("/urls/:id", (req, res) => {
  if (!urlDatabase.hasOwnProperty(req.params.id)) {
    res.redirect(404, '/login');
    return;
  }
  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    let templateVars = {
      urls: urlDatabase[req.params.id],
      userObj: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    let templateVars = { userObj: users[req.session.user_id] };
    res.render('denied', templateVars);
  } 
});

// URL POST - Updates long url
app.post("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    var todayDate = helper.dateMaker();
    let link = req.params.id;
    helper.addToURLDatabase(link, req.body.longURL, req.session.user_id, todayDate);
    res.redirect('/urls');
  } else {
    res.redirect('/urls');
  }
});

// Deletes link of choice and redirects to url page
app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session.user_id) {  
    delete urlDatabase[req.params.id];
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
    urlDatabase[req.params.shortURL].count++
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(302, longURL);
  }
});

// Logs user out, clears cookies, redirects to urls page
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});
