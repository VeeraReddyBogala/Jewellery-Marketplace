
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";

function Register() {
  const [role, setRole] = useState("customer");
  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    address: "",
    gst_number: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const endpoint =
      role === "customer"
        ? "/api/customers/register"
        : "/api/jewellers/register";

    const registrationData =
      role === "customer"
        ? {
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
          }
        : {
            business_name: formData.business_name,
            phone: formData.phone,
            address: formData.address,
            gst_number: formData.gst_number || null,
            password: formData.password
          };

    try {
      const response = await axios.post(endpoint, registrationData);

      setSuccess(
        role === "customer"
          ? "Registration successful! You can now login."
          : "Jeweller registration successful! Please wait for admin approval."
      );

      setFormData({
        full_name: "",
        business_name: "",
        email: "",
        phone: "",
        address: "",
        gst_number: "",
        password: ""
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1>GoldBiz</h1>
        <h2>Create Account</h2>
        <p>Join our jewellery marketplace</p>

        <form onSubmit={handleRegister}>
          <label>Register as</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setError("");
              setSuccess("");
            }}
          >
            <option value="customer">Customer</option>
            <option value="jeweller">Jeweller</option>
          </select>

          {role === "customer" ? (
            <>
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />

              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </>
          ) : (
            <>
              <label>Business Name</label>
              <input
                type="text"
                name="business_name"
                placeholder="Enter showroom name"
                value={formData.business_name}
                onChange={handleChange}
                required
              />

              <label>Business Address</label>
              <textarea
                name="address"
                placeholder="Enter business address"
                value={formData.address}
                onChange={handleChange}
                required
              />

              <label>GST Number (Optional)</label>
              <input
                type="text"
                name="gst_number"
                placeholder="Enter GST number"
                value={formData.gst_number}
                onChange={handleChange}
              />
            </>
          )}

          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {error && <p className="register-error">{error}</p>}
          {success && <p className="register-success">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
}

export default Register;
