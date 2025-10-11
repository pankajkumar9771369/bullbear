// Home.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { GeneralContextProvider } from "./GeneralContext";

import WatchList from "./WatchList";
import Summary from "./Summary";
import Orders from "./Orders";
import Holdings from "./Holdings";
import Positions from "./Positions";
import Funds from "./Funds";
import Apps from "./Apps";
import PaymentSuccess from "./PaymentSuccess";
import TopBar from "./TopBar";
import SellPage from "./SellPage";
const Home = () => {
  return (
    <GeneralContextProvider>
      <TopBar />
      <div className="dashboard-container">
        <WatchList />
        <div className="content">
          <Routes>
            {/* Default route → /jammu */}
            <Route index element={<Summary />} />
            
            {/* ✅ Use relative paths (NO leading '/') */}
            <Route path="orders" element={<Orders />} />
            <Route path="holdings" element={<Holdings />} />
            <Route path="positions" element={<Positions />} />
            <Route path="funds" element={<Funds />} />
            <Route path="apps" element={<Apps />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
<Route path="sell" element={<SellPage />} />
            {/* 404 inside dashboard */}
            <Route path="*" element={<div>Dashboard page not found</div>} />
          </Routes>
        </div>
      </div>
    </GeneralContextProvider>
  );
};

export default Home;
