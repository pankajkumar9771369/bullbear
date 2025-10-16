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
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("userToken");
      console.log("🔐 Auth check - Token found:", !!token);
      
      // Validate token properly
      const isValidToken = token && token !== "undefined" && token !== "null" && token.length > 10;
      
      setLoggedIn(isValidToken);
      setAuthChecked(true);
    };

    // Check immediately
    checkAuthStatus();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    // Listen for custom auth changes
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Function to update login state
  const handleLoginSuccess = () => {
    console.log("✅ Login success callback triggered");
    const token = localStorage.getItem("userToken");
    const isValidToken = token && token !== "undefined" && token !== "null" && token.length > 10;
    setLoggedIn(isValidToken);
  };

  // Function to handle logout
  const handleLogout = () => {
    console.log("🚪 Logout triggered");
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setLoggedIn(false);
    
    // Dispatch events for synchronization
    window.dispatchEvent(new Event('authChange'));
  };

  // Show loading while checking auth status
  if (!authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Show Navbar only when NOT logged in */}
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