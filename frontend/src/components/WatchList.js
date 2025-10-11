import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import DoughnutChart from "./DoughnoutChart";
import GeneralContext from "./GeneralContext";
import WatchListItem from "./WatchListItem";
import WatchListSearch from "./WatchListSearch";
import "./WatchList.css";

const WatchList = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const generalContext = useContext(GeneralContext);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await axios.get("http://localhost:3002/api/watchlist");
        setWatchlist(res.data || []);
      } catch (err) {
        console.error("Failed to fetch watchlist:", err);
        setWatchlist([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, []);

  // Safe data preparation for chart
  const chartData = {
    labels: watchlist.filter(s => s?.name).map(s => s.name),
    datasets: [
      {
        label: "Price",
        data: watchlist.filter(s => s).map(s => s.currentPrice || s.price || 0),
        backgroundColor: [
          '#387ED1', '#00B386', '#FF4D4D', '#FFB800',
          '#8E44AD', '#3498DB', '#E74C3C', '#2ECC71'
        ],
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  };

  if (loading) {
    return (
      <div className="watchlist-zerodha">
        <div className="watchlist-loading">
          <div className="loading-spinner"></div>
          Loading watchlist...
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-zerodha">
      <div className="watchlist-header">
        <h2>Watchlist</h2>
        <WatchListSearch watchlist={watchlist} setWatchlist={setWatchlist} />
      </div>

      <div className="watchlist-content">
        <div className="watchlist-stocks">
          <div className="stocks-header">
            <span>Instrument</span>
            <span>LTP</span>
            <span>Change</span>
          </div>
          <div className="stocks-list">
            {watchlist.length > 0 ? (
              watchlist.map((stock, index) => (
                stock ? (
                  <WatchListItem 
                    stock={stock} 
                    key={stock.id || `stock-${index}`} 
                    generalContext={generalContext} 
                  />
                ) : null
              ))
            ) : (
              <div className="watchlist-empty">
                <div className="empty-icon">📊</div>
                <p className="empty-title">No stocks in watchlist</p>
                <p className="empty-subtitle">Add stocks to see them here</p>
              </div>
            )}
          </div>
        </div>

        {watchlist.length > 0 && (
          <div className="watchlist-chart">
            <DoughnutChart data={chartData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchList;