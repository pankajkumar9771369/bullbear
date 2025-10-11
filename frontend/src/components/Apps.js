import React from "react";
import "./Apps.css";

const Apps = () => {
  const apps = [
    {
      id: 1,
      name: "Console",
      description: "Manage your account, track performance, and access reports",
      icon: "📊",
      url: "https://console.zerodha.com",
      category: "Trading & Analysis"
    },
    {
      id: 2,
      name: "Kite",
      description: "Modern trading platform with advanced charts and tools",
      icon: "🪁",
      url: "https://kite.zerodha.com",
      category: "Trading & Analysis"
    },
    {
      id: 3,
      name: "Coin",
      description: "Direct mutual funds with zero commission",
      icon: "🪙",
      url: "https://coin.zerodha.com",
      category: "Investing"
    },
    {
      id: 4,
      name: "Kite Connect",
      description: "API platform for developers and algo traders",
      icon: "🔌",
      url: "https://kite.trade",
      category: "Developer Tools"
    },
    {
      id: 5,
      name: "Console Mobile",
      description: "Mobile app for account management on the go",
      icon: "📱",
      url: "https://zerodha.com/mobile",
      category: "Mobile Apps"
    },
    {
      id: 6,
      name: "Varsity",
      description: "Learn markets and trading with simple lessons",
      icon: "📚",
      url: "https://zerodha.com/varsity",
      category: "Education"
    },
    {
      id: 7,
      name: "Quantamental",
      description: "Quantitative analysis and research platform",
      icon: "📈",
      url: "https://quantamental.zerodha.com",
      category: "Trading & Analysis"
    },
    {
      id: 8,
      name: "Streak",
      description: "Algorithmic trading without coding",
      icon: "⚡",
      url: "https://streak.zerodha.com",
      category: "Trading & Analysis"
    }
  ];

  const categories = [...new Set(apps.map(app => app.category))];

  return (
    <div className="apps-container">
      <div className="apps-header">
        <h1>Apps & Platforms</h1>
        <p>All our platforms and tools to help you trade and invest better</p>
      </div>

      <div className="apps-content">
        {categories.map(category => (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            <div className="apps-grid">
              {apps
                .filter(app => app.category === category)
                .map(app => (
                  <a
                    key={app.id}
                    href={app.url}
                    className="app-card"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="app-icon">{app.icon}</div>
                    <div className="app-content">
                      <h3 className="app-name">{app.name}</h3>
                      <p className="app-description">{app.description}</p>
                    </div>
                    <div className="app-arrow">→</div>
                  </a>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="apps-footer">
        <div className="footer-card">
          <h3>Need Help?</h3>
          <p>Check out our documentation or contact support</p>
          <div className="footer-links">
            <a href="https://support.zerodha.com" target="_blank" rel="noopener noreferrer">
              Support Center
            </a>
            <a href="https://zerodha.com/tutorials" target="_blank" rel="noopener noreferrer">
              Tutorials
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apps;