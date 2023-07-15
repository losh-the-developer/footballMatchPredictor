const fs = require('fs');
const path = require('path');
const axios = require('axios');

const fetchMatches = async (date) => {
  const matchesDir = path.join(__dirname, 'matches');
  const filePath = path.join(matchesDir, `${date}-matches.json`);
  const currentDate = new Date().toISOString().slice(0, 10);

  // Check if the "matches" directory exists, create it if it doesn't
  if (!fs.existsSync(matchesDir)) {
    fs.mkdirSync(matchesDir);
  }

  if (fs.existsSync(filePath) && date !== currentDate) {
    // If the file exists and the date is not today, load the data from the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data;
  } else {
    // If the file doesn't exist or the date is today, make an API call to fetch the matches
    const response = await axios.get(`https://www.fotmob.com/api/matches?date=${date}`);
    const { data } = response;
    // Process the fetched matches as needed

    // Save the fetched data to the file
    fs.writeFileSync(filePath, JSON.stringify(data));

    return data;
  }
};

module.exports = fetchMatches;
