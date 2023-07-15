import React from 'react';
import Navbar from './components/nav/Navbar';
import Home from './Home';

const App: React.FC = () => {
  return (
    <div className="App">
      <Navbar />
      <Home />
    </div>
  );
};

export default App;
