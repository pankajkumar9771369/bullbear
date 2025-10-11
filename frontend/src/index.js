import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import HomePage from "./home_page/home/HomePage";
import AboutPage from "./home_page/about/AboutPage";
import ProductPage from "./home_page/products/ProductsPage";
import PricingPage from "./home_page/pricing/PricingPage";
import SupportPage from "./home_page/support/SupportPage";

import Navbar from "./home_page/Navbar";
import Footer from "./home_page/Footer";
import Signup from "./home_page/Auth/Signup";
import Login from "./home_page/Auth/Login";

import Home from "./components/Home";

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  // Check authentication status on app load and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("userToken");
      setLoggedIn(!!token);
    };

    // Check immediately
    checkAuthStatus();

    // Listen for storage changes (when login/signup sets token)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically (optional but helpful)
    const interval = setInterval(checkAuthStatus, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Function to update login state (pass this to child components)
  const handleLoginSuccess = () => {
    setLoggedIn(true);
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setLoggedIn(false);
  };

  return (
    <BrowserRouter>
      {/* Pass handleLogout to Navbar if you have logout functionality */}
      {!loggedIn && <Navbar />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/login" 
          element={<Login onLoginSuccess={handleLoginSuccess} />} 
        />
        <Route 
          path="/signup" 
          element={<Signup onLoginSuccess={handleLoginSuccess} />} 
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/support" element={<SupportPage />} />

        {/* Private routes */}
        <Route
          path="/jammu/*"
          element={loggedIn ? <Home onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />

        {/* Redirect any unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!loggedIn && <Footer />}
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);