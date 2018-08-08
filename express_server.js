// Requirements
var express = require("express");
var app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

var PORT = 8080; // default port 8080

// middleware to parse body of POST request
app.use(bodyParser.urlencoded({extended: true})); 

// Parsing cookies
app.use(cookieParser());

// Set the view engine to EJS
app.set('view engine', 'ejs');

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

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


// Home page
app.get("/", (req, res) => {
  res.end("Hello! Welcome to Tiny App");
});



// Displays current directory of shortened links and link to shorten a new one
app.get('/urls', (req, res) => {
  console.log(req)
  let templateVars = {  urls: urlDatabase, username: req.cookies["username"] };
  res.render('urls_index', templateVars);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// Link generator
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"]}
  res.render("urls_new", templateVars);
});

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
                      username: req.cookies["username"] 
                      };
  res.render("urls_show", templateVars);
});

// Creates server with given port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Stores username input as cookie and redirects user to /urls


