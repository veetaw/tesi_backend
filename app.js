var express = require("express");
var path = require("path");
var logger = require("morgan");
const admin = require("firebase-admin");

require("dotenv").config({ path: path.resolve(__dirname, "./secret.env") });

const sequelize = require("./services/db");

var aiRouter = require("./routes/ai");
var coursesRouter = require("./routes/courses");

var serviceAccount = require("./serviceAccountKey.json");

sequelize
  .sync({ force: false })
  .then(() => {})
  .catch((err) => console.log("Errore di sincronizzazione:", err));

var app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/ai", aiRouter);
app.use("/courses", coursesRouter);

module.exports = app;
