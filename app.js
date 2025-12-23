// app.js
require("dotenv").config();

const expressSession = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { prisma } = require("./lib/prisma");
const express = require("express");
const path = require("node:path");
const passport = require("passport");
const configurePassport = require("./config/passport");

// Import Routers
const indexRouter = require("./routes/indexRouter");
const foldersRouter = require("./routes/foldersRouter");


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


// ----- Passport configuration -----
configurePassport(passport, prisma);


// ----- Express middleware -----
app.use(express.urlencoded({ extended: false }));

app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000
    },
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
    })
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// ------- Routers -------
app.use("/", indexRouter);
app.use("/folders", foldersRouter);




const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`)
})