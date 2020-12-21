const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const mongoose = require('mongoose');

// Set up database and schema
mongoose.set('debug', true);
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {console.log('Successfully connected to database');});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  exercises: [{
    description: String,
    duration: Number,
    date: Date
  }]
});

const User = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', async (req, res) => {
  try {
    const userDoc = await User.findOne({username: req.body.username}).exec();

    if (userDoc) {
      return res.send("Username already taken, please try again!");
    }

    const savedUser = await User.create({username: req.body.username});

    return res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  }
  catch (error) {
    console.error(error);
    return res.json({"error": error.message});
  }
});

app.get('/api/exercise/users', async (req, res) => {
  try {
    return res.json(await User.find().exec());
  }
  catch (error) {
    console.error(error);
    return res.json({"error": error.message});
  }
});
  
app.post('/api/exercise/add', async (req, res) => {
  try {
    const date = req.body.date ? new Date(req.body.date) : new Date();
    
    const userDoc = await User.findById(req.body.userId).orFail().exec();
    
    userDoc.exercises.push({
      description: req.body.description,
      duration: req.body.duration,
      date: date
    });
    
    const updatedUser = await userDoc.save();
    
    return res.json({
      username: updatedUser.username,
      _id: updatedUser._id,
      description: req.body.description,
      duration: parseFloat(req.body.duration),
      date: date.toDateString()
    });
  }
  catch (error) {
    console.error(error);
    return res.json({"error": error.message});
  }
});


app.get('/api/exercise/log', async (req, res) => {
  try {
    const fromDate = new Date(req.query.from);
    const toDate = new Date(req.query.to);
    const limit = Number(req.query.limit).floor();

    const userDoc = await User.findById(req.query.userId).orFail().exec();
    let log = userDoc.exercises;

    if (isValidDate(fromDate)) {
      log = log.filter(element => element.date >= fromDate);
    }
    
    if (isValidDate(toDate)) {
      log = log.filter(element => element.date <= toDate);
    }

    if (limit >= 0) {
      log = log.slice(0, limit);
    }
    
    return res.json({
      username: userDoc.username,
      _id: userDoc._id,
      log: log,
      count: log.length
    });
  }
  catch (error) {
    console.error(error);
    return res.json({"error": error.message});
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

//-------------------------------------------

function isValidDate(date) {
  return date.getTime() === date.getTime();
}