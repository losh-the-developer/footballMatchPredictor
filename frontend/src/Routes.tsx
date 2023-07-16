import React from 'react';
import { BrowserRouter as Router, Route, Routes as RouterRoutes } from 'react-router-dom';
import HomePage from './pages/Home';
import BettingPage from './pages/Bets';

const AppRoutes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<HomePage />} />
      <Route path="/betting" element={<BettingPage />} />
      {/* Add more routes for other pages */}
    </RouterRoutes>
  );
};

const AppRouter = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default AppRouter;
