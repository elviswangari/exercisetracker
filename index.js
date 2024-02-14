const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { Schema } = mongoose;
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL);

// Create a schema
const userSchema = new Schema({
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});

// Create a model
const User = mongoose.model("User", userSchema);
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;
    const user = new User({ username });
    const savedUser = await user.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users", (req, res) => {
  const users = User.find({}, "username _id");
  users.then((data) => {
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const exercise = {
    description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString(),
  };
  user.log.push(exercise);
  user.count = user.log.length;
  await user.save();
  res.json({
    _id: userId,
    username: user.username,
    ...exercise,
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  let log = user.log;
  if (from) {
    const fromDate = new Date(from);
    log = log.filter((exercise) => new Date(exercise.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    log = log.filter((exercise) => new Date(exercise.date) <= toDate);
  }
  if (limit) {
    log = log.slice(0, parseInt(limit));
  }
  res.json({
    _id: userId,
    username: user.username,
    count: log.length,
    log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
