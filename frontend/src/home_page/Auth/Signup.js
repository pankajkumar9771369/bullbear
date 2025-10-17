import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { jwtDecode } from "jwt-decode";

const Signup = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
    username: "",
  });
  const { email, password, username } = inputValue;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue({ ...inputValue, [name]: value });
  };

  const handleError = (err) =>
    toast.error(err, { position: "bottom-left" });
  const handleSuccess = (msg) =>
    toast.success(msg, { position: "bottom-right" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post(
        "https://alphaedge.onrender.com/api/auth/signup",
        { ...inputValue },
        { 
        
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Signup response:", data);

      const { success, message, user, token } = data;

      if (success && token) {
        handleSuccess(message);

        // ✅ Decode token
        const decodedToken = jwtDecode(token);
        console.log("Decoded Token:", decodedToken);

        // ✅ Store in localStorage
        localStorage.setItem("userToken", token);
        localStorage.setItem("userId", decodedToken.id || user?._id || "");
        localStorage.setItem(
          "userName",
          decodedToken.username || user?.username || "Trader"
        );

        console.log("✅ Signup successful - Token stored");

        // ✅ Call the parent's login success handler
        if (onLoginSuccess) {
          onLoginSuccess();
        }

        // ✅ CRITICAL FIX: Dispatch storage event for same-tab sync
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('authChange'));

        console.log("✅ Auth events dispatched");

        // Navigate to dashboard
        setTimeout(() => {
          navigate("/jammu");
        }, 1000);

      } else {
        handleError(message || "Signup failed: No token received");
      }
    } catch (error) {
      console.error("Signup error:", error);
      if (error.response) {
        handleError(error.response.data.message || "Signup failed");
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
        <h3 className="text-center mb-4">Sign Up</h3>
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
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={username}
              onChange={handleOnChange}
              className="form-control"
              placeholder="Enter your username"
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
            Sign Up
          </button>
        </form>
        <p className="text-center mt-3">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Signup;