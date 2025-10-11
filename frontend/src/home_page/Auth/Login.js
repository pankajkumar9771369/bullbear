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
        "http://localhost:3002/api/auth/login", // ✅ backend should run on port 3003
        { ...inputValue },
        { withCredentials: true, }
      );

      console.log("Login response:", data);

      const { success, message, user, token } = data;
console.log("Received token:", token);
      if (success && token) {
        handleSuccess(message);

     
        const decodedToken = jwtDecode(token);
        console.log("Decoded Token:", decodedToken);

       
       localStorage.setItem("userToken", token);  
console.log("Saved token in localStorage:", token);  


        localStorage.setItem("userId", decodedToken.id || user?._id || "");
        localStorage.setItem(
          "userName",
          decodedToken.username || user?.username || "Trader"
        );

        console.log("Stored user data in localStorage:");
        console.log("User ID:", localStorage.getItem("userId"));
        console.log("Username:", localStorage.getItem("userName"));

        // ✅ Redirect to dashboard (jammu)
        if (onLoginSuccess) {
          onLoginSuccess();
        }
       handleSuccess(message);
navigate("/jammu");
      
      } else {
        handleError(message || "Login failed: No token received");
        console.error("Login failed: No token received");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        handleError(error.response.data.message || "Invalid credentials");
        console.error("Backend response error:", error.response.data);
      } else {
        handleError("Network error. Please try again.");
        console.error("Network or server error during login", error);
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
          Don’t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;
