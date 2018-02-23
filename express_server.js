var express = require("express");  // change var to const/let for ES6 throughout
var cookieParser = require("cookie-parser");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var bodyParser = require("body-parser");

app.set("view engine", "ejs")

app.use(cookieParser());

var urlDatabase = {
  "userRandomID": {
    "b2xVn2": "http://www.lighthouselabs.ca"
  },
  "user2RandomID": {
    "9sm5xK": "http://www.google.com"
  }
};

// var newDatabase = {
//   "userRandomID": { tinyurl1: {},
//   tinyurl2: {longurl},
//   tinyurl3: {long url}
//     ...
//   }
// }

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
  }
}

app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
 // urlsForUser(req.cookies.user_id);  // calling function to attemp to integrate into index.

  let templateVars = {
    userURLs: urlDatabase[req.cookies.user_id],
    user: users[req.cookies.user_id]
   // urls: urlsForUser(req.cookies.user_id)//.req.cookies.user_id
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id]  // added whole templateVars for cookies
  };
  if (users[req.cookies.user_id]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id], // added line to template vars for cookies
    shortURL: req.params.id, //req.params.id.  id = the user input after /urls/
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {  // ensuring email and password are filled out
    res.status(400).send('Must fill in email and password sections');
  }
  for (let id in users) {
    if (req.body.email == users[id].email) {  // making sure register email doesnt already exist
      return res.status(400).send('Email already exists');
    }
  }
  const randomID = generateRandomString();  // generating random 6 digit ID for user
  users[randomID] = {"id": randomID, "email": req.body.email, "password": req.body.password};
  res.cookie('user_id', randomID);
  res.redirect('/urls/');
})

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/urls", (req, res) => {
    const shortURL = generateRandomString();  // generating random 6 digit ID for inputted URL
    if (!urlDatabase[req.cookies.user_id]) {
    urlDatabase[req.cookies.user_id] = {};
    urlDatabase[req.cookies.user_id][shortURL] = req.body.longURL;
    } else {
      urlDatabase[req.cookies.user_id][shortURL] = req.body.longURL;
    }
 res.redirect(`urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  // if(req.cookies.user_id) {
  //   let longURL = urlDatabase[req.cookies.user_id][req.params.shortURL];
  //   res.redirect(longURL);
  // } else {
    var fullURL = findUserID(req.params.shortURL);
    res.redirect(fullURL);
  //}
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.cookies.user_id][req.params.id]; // used to be urlDatabase.[req.params.id]
  res.redirect("/urls/");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.cookies.user_id][req.params.id] = req.body.longURL;
  res.redirect("/urls/");
});


app.post("/login", (req, res) => {
  let userIden = findUserByEmail(req.body.email);
 if (!userIden) {
   res.status(403).send("Email is invalid!")
 } else if (!hasUserPass(req.body.email, req.body.password)) {
   res.status(403).send("Password is invalid!")
 } else {
   res.cookie('user_id', userIden);
   res.redirect("/urls");
 }
});


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls/");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function findUserByEmail(email) {
 for (let user in users) {
   if (users[user].email === email) {
     return users[user].id
   }
  }
}

function findUserID (URL) {
  for (var userCode in urlDatabase) {
    if (urlDatabase[userCode][URL]) {
      return urlDatabase[userCode][URL]
      console.log(urlDatabase[userCode][URL]);
    }
  }
}

// function hasUserPass(email, password) {
//   for (let user in users) {
//     if (email == users[user].email) {
//       if (password == users[user].password) {
//         return true;
//       } else {
//       }
//     }
//   }
//   return false;
// }

