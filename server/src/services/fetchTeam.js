const axios = require('axios');

const fetchTeam = async (teamId) => {
  const response = await axios.get(`https://www.fotmob.com/api/teams?id=${teamId}`);
  const { data } = response;
  // Process the fetched matches as needed
  return data;
};

module.exports = fetchTeam;
