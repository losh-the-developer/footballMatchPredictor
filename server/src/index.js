const express = require('express');
const cors = require('cors');
const fetchMatches = require('./services/fetchMatches');
const fetchTeam = require('./services/fetchTeam');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.get('/matches', async (req, res) => {
  const date = req.query.date;
  const matches = await fetchMatches(date);
  res.json(matches);
});

app.get('/teams', async (req, res) => {
  try {
    const teamId = req.query.id;
    const response = await axios.get(`https://www.fotmob.com/api/teams?id=${teamId}`);
    const data = response.data;

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }

});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// const cron = require('node-cron');

// const task = cron.schedule('0 1 * * *', async () => {
//   await fetchMatches();
//   console.log('Matches fetched');
// });

// task.start();

