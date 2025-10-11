import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Menu.css"
const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
    setIsProfileDropdownOpen(false);
  };
 const handleCancel = () => {
    setIsProfileDropdownOpen(false);
  };
  // Get token and user info
  const params = new URLSearchParams(window.location.search);
  let token = params.get("token");

  if (!token) {
    token = localStorage.getItem("userToken");
  }

  let userName = "Trader"; // Default value
  
  // Always try to get userName from localStorage first
  userName = localStorage.getItem('userName') || "Trader";
  
  // If we have a token, try to decode it to get the username
  if (token && typeof token === 'string') {
    try {
      const decoded = jwtDecode(token);
      userName = decoded.username || userName;
      // Also store the username in localStorage for future use
      if (decoded.username) {
        localStorage.setItem('userName', decoded.username);
      }
    } catch (decodeError) {
      console.error("Error decoding token:", decodeError);
      // Keep the existing userName from localStorage
    }
  }

  console.log("Username:", userName);

  // Get first and last letter of username
  const getInitials = (name) => {
    if (!name || name === "Trader") return "T";
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    } else {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsProfileDropdownOpen(false);
    navigate("/");
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  return (
    <div className="menu-container">
      <img src="/logo.png"style={{ width: "50px" }} alt="Logo" />
      <div className="menus">
        <ul>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/jammu"
              onClick={() => handleMenuClick(0)}
            >
              <p  style={{marginTop:"30px"}}className={selectedMenu === 0 ? activeMenuClass : menuClass}>
                Dashboard
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/jammu/orders"
              onClick={() => handleMenuClick(1)}
            >
              <p className={selectedMenu === 1 ? activeMenuClass : menuClass}>
                Orders
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/jammu/holdings"
              onClick={() => handleMenuClick(2)}
            >
              <p className={selectedMenu === 2 ? activeMenuClass : menuClass}>
                Holdings
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/jammu/positions"
              onClick={() => handleMenuClick(3)}
            >
              <p className={selectedMenu === 3 ? activeMenuClass : menuClass}>
                Positions
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/jammu/funds"
              onClick={() => handleMenuClick(4)}
            >
              <p className={selectedMenu === 4 ? activeMenuClass : menuClass}>
                Funds
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/jammu/apps"
              onClick={() => handleMenuClick(6)}
            >
              <p className={selectedMenu === 6 ? activeMenuClass : menuClass}>
                Apps
              </p>
            </Link>
          </li>
        </ul>
        <hr />
        
        {/* Profile Section with Circular Icon */}
        <div className="profile-dropdown">
          <button 
            className="profile-icon-btn" 
            onClick={handleProfileClick}
            title={userName}
          >
            <div className="profile-icon">
              {getInitials(userName)}
            </div>
          </button>
          
          {isProfileDropdownOpen && (
            <div className="dropdown-content">
              <div className="user-info">
               
                <span className="username">{userName}</span>
                  <button 
                  className="cancel-btn"
                  onClick={handleCancel}
                  title="Close"
                >
                  ×
                </button>
              </div>
              
              <button 
                onClick={handleLogout} 
                className="logout-btn"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Menu;