var express = require("express");
var cookieSession = require('cookie-session');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var bodyParser = require("body-parser");
var bcrypt = require('bcrypt');

app.set("view engine", "ejs")

app.use(cookieSession({
  name: 'user_id',
  secret: 'abcdefg'
}));

app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = { // object that takes in additional URL key/values -
  "userRandomID": { // - under an object linked to user that created
    "b2xVn2": "http://www.lighthouselabs.ca"
  },
  "user2RandomID": {
    "9sm5xK": "http://www.google.com"
  }
};

var users = {  // when registered, users will be stored as objects within the users object
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => { // renders index page
  var templateVars = {
    userURLs: urlDatabase[req.session.user_id],
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  var templateVars = {
    user: users[req.session.user_id]  // added whole templateVars for cookies
  };
  if (users[req.session.user_id]) { // user cannot go to create short URLS unless signed in
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login") // if user is not logged in and tries to click create URL, redirects to login
  }
});

app.get("/urls/:id", (req, res) => {
  var templateVars = {
    shortURL: req.params.id, //req.params.id.  id = the user input after /urls/
    longURL: urlDatabase[req.session.user_id][req.params.id],
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
  res.render("register");
  }
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {  // ensuring email and password are filled out
    res.status(400).send('Must fill in email and password sections');
  }
  for (var id in users) {
    if (req.body.email == users[id].email) {  // making sure register email doesnt already exist
      return res.status(400).send('Email already exists');
    }
  }
  var randomID = generateRandomString();  // generating random 6 digit ID for user
  users[randomID] = {"id": randomID, "email": req.body.email, "password": bcrypt.hashSync(req.body.password, 10)};
  req.session.user_id = randomID;
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
  res.render("login");
  }
});

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString();  // generating random 6 digit ID for inputted URL
  if (!urlDatabase[req.session.user_id]) {
    urlDatabase[req.session.user_id] = {};
    urlDatabase[req.session.user_id][shortURL] = req.body.longURL;
  } else {
    urlDatabase[req.session.user_id][shortURL] = req.body.longURL;
  }
  res.redirect(`urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  if (!findUserID(req.params.shortURL)) {
    res.status(404).send('Invalid short URL')
  } else {
  var fullURL = findUserID(req.params.shortURL);
  res.redirect(fullURL);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.session.user_id][req.params.id]; // used to be urlDatabase.[req.params.id]
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.session.user_id][req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {  // checks if login information matches server and redirects to urls if so
  var userIden = findUserByEmail(req.body.email);
  if (!userIden) {
   res.status(403).send("Email is invalid!")
  } else if (!hasUserPass(req.body.email, req.body.password)) {
   res.status(403).send("Password is invalid!")
  } else {
   req.session.user_id = userIden;
   res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
 res.clearCookie("user_id");
 res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() { // generates random 6 digit string
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function findUserByEmail(email) { //  finds the email associated with user logging in
  for (var user in users) {
    if (users[user].email === email) {
     return users[user].id;
    }
  }
}

function findUserID (URL) { // finds user id associated with the inputted shortURL to redirect
  for (var userCode in urlDatabase) { // even if user is not logged in
    if (urlDatabase[userCode][URL]) {
      return urlDatabase[userCode][URL]
    }
  }
}

function hasUserPass(email, password) { // compares email / password to ensure login credentials
  for (var user in users) {
    if (email == users[user].email) {
      if (bcrypt.compareSync(password, users[user].password)) {
        return true;
      } else {
      }
    }
  }
  return false;
}