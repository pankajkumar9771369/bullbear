import React from "react";
import { Route, Routes } from "react-router-dom";
import "../index.css";

import Navbar from "./Navbar"; 

import Footer from "./Footer";
import HomePage from "./home/HomePage";

import AboutPage from "./about/AboutPage";
import ProductPage from "./products/ProductsPage";
import PricingPage from "./pricing/PricingPage";
import SupportPage from "./support/SupportPage";
import Login from "./Auth/Login";
import Signup from "./Auth/Signup";

const App = () => {

  return (
    <div className="homepage-container">
      <Navbar />
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login/>}/>
       <Route path="/signup" element={<Signup/>}/>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/support" element={<SupportPage />} />

      
        {/* Fallback route for 404 pages */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
