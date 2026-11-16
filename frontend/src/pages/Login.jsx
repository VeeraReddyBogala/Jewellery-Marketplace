
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const [role, setRole] = useState("customer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let endpoint = "";

    if (role === "customer") {
      endpoint = "/api/customers/login";
    } else if (role === "jeweller") {
      endpoint = "/api/jewellers/login";
    } else {
      endpoint = "/api/admin/login";
    }

    const loginData =
      role === "jeweller"
        ? { phone: identifier, password }
        : { email: identifier, password };

    try {
      const response = await axios.post(endpoint, loginData);

      const token = response.data.token;

      if (!token) {
        setError("Login response did not contain an authentication token.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      alert("Login successful!");

      if (role === "customer") {
        navigate("/customer-dashboard");
      } else if (role === "jeweller") {
        navigate("/jeweller-dashboard");
      } else {
        navigate("/admin-dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>GoldBiz</h1>
        <h2>Welcome Back</h2>
        <p>Login to your account</p>

        <label>Login as</label>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setIdentifier("");
            setError("");
          }}
        >
          <option value="customer">Customer</option>
          <option value="jeweller">Jeweller</option>
          <option value="admin">Admin</option>
        </select>

        <form onSubmit={handleLogin}>
          <label>
            {role === "jeweller" ? "Phone Number" : "Email"}
          </label>

          <input
            type={role === "jeweller" ? "tel" : "email"}
            placeholder={
              role === "jeweller"
                ? "Enter phone number"
                : "Enter email address"
            }
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
