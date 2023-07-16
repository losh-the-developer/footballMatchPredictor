import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>

      <section>
        
        <Link to="/betting"><h2>Daily Betting (over 1.5)</h2></Link>
      </section>

      <section>
        <h2>Top Leagues</h2>
        <p>Additional section on the home page</p>
        {/* Add more sections and links as needed */}
      </section>
    </div>
  );
};

export default HomePage;
