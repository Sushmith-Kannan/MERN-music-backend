const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use original filename for simplicity
  }
});
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/badaga_music', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

const trackSchema = new mongoose.Schema({
  title: String,
  artist: String,
  album: String,
  audioFilePath: String,
});

const Track = mongoose.model('Track', trackSchema);

// Serve audio files from 'uploads' directory
app.use('/audio', express.static(path.join(__dirname, 'uploads')));

// Route to fetch all tracks
app.get('/tracks', async (req, res) => {
  try {
    const tracks = await Track.find();
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to fetch tracks by artist
app.get('/artists/:artist', async (req, res) => {
  try {
    const artist = req.params.artist;
    const tracks = await Track.find({ artist: artist });
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks by artist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to fetch tracks by album
app.get('/albums/:album', async (req, res) => {
  try {
    const album = req.params.album;
    const tracks = await Track.find({ album: album });
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks by album:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to fetch tracks by genre
app.get('/genres/:genre', async (req, res) => {
  try {
    const genre = req.params.genre;
    const tracks = await Track.find({ genre: genre });
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks by album:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to add a new track with audio file upload
app.post('/tracks', upload.single('audioFile'), async (req, res) => {
  try {
    const { title, artist, album } = req.body;

    // Get the uploaded file details
    const audioFile = req.file;
    if (!audioFile) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    // Save the audio file path in MongoDB
    const audioFilePath = `/audio/${audioFile.filename}`;
    const track = new Track({ title, artist, album, audioFilePath });
    await track.save();

    res.json(track);
  } catch (error) {
    console.error('Error saving track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to fetch a track by ID
app.get('/tracks/:id', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }
    res.json(track);
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to fetch the next track by ID
app.get('/next/:id', async (req, res) => {
  try {
    const currentTrack = await Track.findById(req.params.id);
    const nextTrack = await Track.findOne({ _id: { $gt: currentTrack._id } }).sort({ _id: 1 }).limit(1);
    if (!nextTrack) {
      const firstTrack = await Track.findOne().sort({ _id: 1 }).limit(1);
      res.json(firstTrack);
    } else {
      res.json(nextTrack);
    }
  } catch (error) {
    console.error('Error fetching next track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to fetch the previous track by ID
app.get('/prev/:id', async (req, res) => {
  try {
    const currentTrack = await Track.findById(req.params.id);
    const prevTrack = await Track.findOne({ _id: { $lt: currentTrack._id } }).sort({ _id: -1 }).limit(1);
    if (!prevTrack) {
      const lastTrack = await Track.findOne().sort({ _id: -1 }).limit(1);
      res.json(lastTrack);
    } else {
      res.json(prevTrack);
    }
  } catch (error) {
    console.error('Error fetching previous track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
