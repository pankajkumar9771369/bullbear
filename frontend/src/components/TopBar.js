// components/TopBar.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import Menu from "./Menu";

const TopBar = () => {
  // Initialize state with all indices
  const [indices, setIndices] = useState({
    nifty: 0,
    sensex: 0,
    niftyBank: 0,
    niftyIt: 0,
    bseMidcap: 0,
    bseSmallcap: 0
  });
  
  const [prevIndices, setPrevIndices] = useState({ ...indices });
  const [displayedIndices, setDisplayedIndices] = useState([]);

  const fetchIndices = async () => {
    try {
      const res = await axios.get("http://localhost:3002/api/indices");
      setPrevIndices(indices);
      setIndices(res.data);
    } catch (err) {
      console.error("Error fetching indices:", err);
    }
  };

  // Function to select 2 random indices
  const selectRandomIndices = () => {
    const indexDisplayConfig = [
      { key: "nifty", label: "NIFTY 50" },
      { key: "sensex", label: "SENSEX" },
      { key: "niftyBank", label: "BANK NIFTY" },
      { key: "niftyIt", label: "NIFTY IT" },
      { key: "bseMidcap", label: "BSE MIDCAP" },
      { key: "bseSmallcap", label: "BSE SMALLCAP" }
    ];

    const shuffled = [...indexDisplayConfig].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  };

  useEffect(() => {
    fetchIndices();
    setDisplayedIndices(selectRandomIndices());
    
    const interval = setInterval(fetchIndices, 10000);
    const rotationInterval = setInterval(() => {
      setDisplayedIndices(selectRandomIndices());
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(rotationInterval);
    };
  }, []);

  // Function to determine color based on price movement (Zerodha style)
  const getColor = (current, previous) => {
    if (current > previous) return "green";
    if (current < previous) return "red";
    return "black";
  };

  return (
    <div className="topbar-container">
      <div className="indices-container">
        {displayedIndices.map((index) => (
          <div key={index.key} className="index-item">
            <span className="index-label">{index.label}</span>
            <span 
              className={`index-points ${getColor(
                indices[index.key] || 0, 
                prevIndices[index.key] || 0
              )}`}
            >
              {(indices[index.key] || 0).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <Menu />

      <style jsx>{`
        .topbar-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 20px;
          background-color: #ffffff;
          border-bottom: 1px solid #e0e0e0;
          height: 48px;
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 12px;
          font-weight: 500;
        }

        .indices-container {
          display: flex;
          gap: 32px;
          align-items: center;
        }

        .index-item {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 32px;
        }

        .index-label {
          color: #424242;
          font-weight: 500;
          white-space: nowrap;
        }

        .index-points {
          font-weight: 600;
          white-space: nowrap;
          transition: color 0.2s ease;
        }

        .index-points.green {
          color: #00b386;
        }

        .index-points.red {
          color: #ff4d4d;
        }

        .index-points.black {
          color: #424242;
        }

        /* Zerodha-like subtle animations */
        .index-points {
          position: relative;
        }

        .index-points.green::before {
          content: "▲";
          font-size: 10px;
          margin-right: 4px;
          color: #00b386;
        }

        .index-points.red::before {
          content: "▼";
          font-size: 10px;
          margin-right: 4px;
          color: #ff4d4d;
        }

        .index-points.black::before {
          content: "●";
          font-size: 6px;
          margin-right: 4px;
          color: #9e9e9e;
        }

        /* Hover effects */
        .index-item:hover .index-label {
          color: #1565c0;
        }

        .index-item:hover .index-points {
          transform: translateX(2px);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .topbar-container {
            padding: 8px 16px;
            height: 44px;
          }
          
          .indices-container {
            gap: 24px;
          }
          
          .index-item {
            gap: 6px;
          }
          
          .index-label {
            font-size: 11px;
          }
          
          .index-points {
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .topbar-container {
            padding: 8px 12px;
          }
          
          .indices-container {
            gap: 16px;
          }
        }

        /* Animation for index rotation */
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-4px); }
          50% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(4px); }
        }

        .indices-container {
          animation: fadeInOut 0.8s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TopBar;