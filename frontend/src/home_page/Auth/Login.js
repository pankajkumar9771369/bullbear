import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { jwtDecode } from "jwt-decode";

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });

  const { email, password } = inputValue;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue({ ...inputValue, [name]: value });
  };

  const handleError = (err) => toast.error(err, { position: "bottom-left" });
  const handleSuccess = (msg) => toast.success(msg, { position: "bottom-right" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post(
        "https://alphaedge.onrender.com/api/auth/login",
        { ...inputValue },
        { withCredentials: true }
      );

      console.log("Login response:", data);

      const { success, message, user, token } = data;

      if (success && token) {
        // Store token and user data
        localStorage.setItem("userToken", token);
        
        const decodedToken = jwtDecode(token);
        localStorage.setItem("userId", decodedToken.id || user?._id || "");
        localStorage.setItem(
          "userName",
          decodedToken.username || user?.username || "Trader"
        );

        console.log("✅ Login successful - Token stored");

        // Call the parent's login success handler
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        handleSuccess(message);
        
        // Force storage event and navigate
        window.dispatchEvent(new Event('storage'));
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate("/jammu");
        }, 100);
        
      } else {
        handleError(message || "Login failed: No token received");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        handleError(error.response.data.message || "Invalid credentials");
      } else {
        handleError("Network error. Please try again.");
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div
        className="card shadow-sm p-4"
        style={{ width: "100%", maxWidth: "400px", borderRadius: "10px" }}
      >
        <h3 className="text-center mb-4">Login to Your Account</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleOnChange}
              className="form-control"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleOnChange}
              className="form-control"
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
        <p className="text-center mt-3">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;