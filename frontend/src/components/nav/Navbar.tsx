import React, { useState } from 'react';

const Navbar = () => {
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10).replace(/-/g, ''));

  const handlePrevious = () => {
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);
    const dateString = previousDate.toISOString().slice(0, 10).replace(/-/g, '');
    setCurrentDate(dateString);
  };

  const handleToday = () => {
    const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setCurrentDate(dateString);
  };

  const handleForward = () => {
    const forwardDate = new Date(currentDate);
    forwardDate.setDate(forwardDate.getDate() + 1);
    const dateString = forwardDate.toISOString().slice(0, 10).replace(/-/g, '');
    setCurrentDate(dateString);
  };

  return (
    <nav className="navbar">
      <button onClick={handlePrevious}>Previous</button>
      <button onClick={handleToday}>Today</button>
      <button onClick={handleForward}>Forward</button>
      <p>Selected Date: {new Date(currentDate).toDateString()}</p>
    </nav>
  );
};

export default Navbar;
