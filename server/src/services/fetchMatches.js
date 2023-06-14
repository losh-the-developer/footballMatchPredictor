const axios = require('axios');

const fetchMatches = async () => {
  const response = await axios.get('https://www.fotmob.com/api/matches');
  const { data } = response;
  // Process the fetched matches as needed
  return data;
};

module.exports = fetchMatches;
