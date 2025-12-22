// app.js
require("dotenv").config();

const express = require("express");
const path = require("node:path");
const indexRouter = require("./routes/indexRouter");
const session = require("express-session");
const passport = require("passport");
const PgSession = require('connect-pg-simple')(session);
const configurePassport = require("./config/passport");


// app setup
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));


// If deployed behind a proxy (Render, Heroku, Railway)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}


// Get The Database Pool
const pool = require("./db/pool");

// ----- Passport configuration -----
configurePassport(passport, pool);


// ----- Express middleware -----
app.use(express.urlencoded({ extended: false }));

app.use(session({
  store: new PgSession({
    pool: pool,                 // your pg Pool
    tableName: 'session',       // optional
    createTableIfMissing: true  // auto-create table
  }),
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// ------- Routers -------
app.use("/", indexRouter);



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`)
})