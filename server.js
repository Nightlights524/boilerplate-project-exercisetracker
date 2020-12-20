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
db.once('open', () => {console.log('Successfully connected');});

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true}
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

    const user = new User({username: req.body.username});
    return res.json(await user.save());
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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})