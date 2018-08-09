// Requirements
var express = require("express");
var app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

var PORT = 8080; // default port 8080

// Middleware to parse body of POST request
app.use(bodyParser.urlencoded({extended: true})); 
app.use(cookieParser()); // Parsing cookies

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

// Given an id and password input, check these against the users database and return true or false
function userPasswordCheck(id, pass) {
  if (users[id].password === pass) {
    return true;
  } else {
    return false;
  }
}

// Databases
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "test123": {
    id: 'test123',
    email: "test@gmail.com",
    password: "testpass"
  }
};

// Home page
app.get("/", (req, res) => {
  res.end("Hello! Welcome to Tiny App");
});

// Register page
app.get("/register", (req, res) => {
  let templateVars = { userObj: users[req.cookies["user_id"]] };
  res.render('register', templateVars)
});

// Login page
app.get("/login", (req, res) => {
  let templateVars = { userObj: users[req.cookies["user_id"]]};
  res.render('login', templateVars)
});

// Login POST -  Stores username input as cookie and redirects user to /urls after handling input erros
app.post("/login", (req, res) => {
  if (!userEmailCheck(req.body.email)) {
    res.redirect(400, "/login");
    return;
  }
  if (!userPasswordCheck(userEmailCheck(req.body.email), req.body.password)) {
    res.redirect(400, "/login");
    return;
  }
  var id = userEmailCheck(req.body.email)
  res.cookie('user_id', id);
  res.redirect('/urls');
});

// Updates user database with input information and adds userID cookie
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
                        password: req.body.password
                      };
      res.cookie('user_id', userID);
      res.redirect('/urls');
      } 
});

// Displays current directory of shortened links and link to shorten a new one
app.get('/urls', (req, res) => {
  let templateVars = {  urls: urlDatabase, userObj: users[req.cookies["user_id"]] };
  res.render('urls_index', templateVars);
});

// Link generator
app.get("/urls/new", (req, res) => {
  let templateVars = { userObj: users[req.cookies["user_id"]]}
  res.render("urls_new", templateVars);
});

// Logs user out, clears cookies, redirects to urls page
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

// Takes in user input, adds new random URL and redirects client
app.post("/urls", (req, res) => {
  let shortenedString = generateRandomString();
  urlDatabase[shortenedString] = req.body.longURL;
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
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(301, longURL);
  }
});

// Updates long url
app.post("/urls/:id", (req, res) => {
  let link = req.params.id;
  urlDatabase[link] = req.body.longURL;
  res.redirect('/urls/')
})

// Displays short and long URL
app.get("/urls/:id", (req, res) => {
  let templateVars = { 
                      shortURL: req.params.id,
                      longURL: urlDatabase,
                      userObj: users[req.cookies["user_id"]] 
                      };
  res.render("urls_show", templateVars);
});

// Creates server with given port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

