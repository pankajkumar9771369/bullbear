import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  
  // Add ref to track if data has been fetched
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch if we haven't fetched already
    if (!hasFetched.current) {
      fetchOrders();
      hasFetched.current = true;
    }
  }, []);

  const fetchOrders = async () => {
    try {
      // Add loading state at the start
      setLoading(true);
      
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:3002/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

   const data = await response.json();
      if (data.success) {
        setOrders(data.data);
        setPagination(data.pagination || {
          current: 1,
          pages: 1,
          total: data.data.length
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component remains the same...
  const getStatusBadge = (status) => {
    const statusConfig = {
      'COMPLETED': { class: 'completed', label: 'Completed' },
      'PENDING': { class: 'pending', label: 'Pending' },
      'CANCELLED': { class: 'cancelled', label: 'Cancelled' },
      'FAILED': { class: 'failed', label: 'Failed' }
    };
    
    const config = statusConfig[status] || { class: 'pending', label: status };
    return <span className={`order-status ${config.class}`}>{config.label}</span>;
  };

  const getTypeBadge = (mode, orderType) => {
    const typeConfig = {
      'BUY': { class: 'buy', label: 'BUY' },
      'SELL': { class: 'sell', label: 'SELL' }
    };
    
    const config = typeConfig[mode] || { class: 'buy', label: mode };
    return (
      <div className="order-type-container">
        <span className={`order-type ${config.class}`}>
          {config.label}
        </span>
        {orderType && orderType !== 'MARKET' && (
          <span className="order-type-sub">{orderType}</span>
        )}
      </div>
    );
  };

  const getProductBadge = (product) => {
    return <span className="product-badge">{product}</span>;
  };

  if (loading) {
    return (
      <div className="orders-zerodha">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Loading orders...
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-zerodha">
        <div className="no-orders-zerodha">
          <div className="no-orders-icon">📋</div>
          <p className="no-orders-title">No orders placed</p>
          <p className="no-orders-subtitle">Your orders will appear here once you start trading</p>
          <Link to={"/"} className="btn-zerodha-primary">
            Start trading
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-zerodha">
      <div className="orders-header">
        <div className="header-content">
          <h2 className="orders-title">Orders</h2>
          <span className="orders-count">({pagination.total})</span>
        </div>
        <div className="header-actions">
          <button className="btn-zerodha-outline" onClick={fetchOrders}>
            Refresh
          </button>
        </div>
      </div>
      
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="text-left">Instrument</th>
              <th className="text-center">Product</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Price</th>
              <th className="text-right">Amount</th>
              <th className="text-center">Type</th>
              <th className="text-center">Status</th>
              <th className="text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="order-row">
                <td className="instrument-cell">
                  <div className="instrument-name">{order.name}</div>
                  <div className="instrument-symbol">{order.symbol}</div>
                  <div className="instrument-exchange">{order.exchange}</div>
                </td>
                <td className="text-center product-cell">
                  {getProductBadge(order.product)}
                </td>
                <td className="text-right quantity-cell">{order.qty}</td>
                <td className="text-right price-cell">₹{order.price.toFixed(2)}</td>
                <td className="text-right amount-cell">₹{order.totalAmount.toFixed(2)}</td>
                <td className="text-center type-cell">
                  {getTypeBadge(order.mode, order.orderType)}
                </td>
                <td className="text-center status-cell">
                  {getStatusBadge(order.status)}
                </td>
                <td className="text-right time-cell">
                  <div className="time-primary">
                    {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                  <div className="time-secondary">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="orders-pagination">
          <button 
            className="pagination-btn" 
            disabled={pagination.current === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.current} of {pagination.pages}
          </span>
          <button 
            className="pagination-btn"
            disabled={pagination.current === pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;