
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerEnquiries from "./pages/CustomerEnquiries";
import JewellerDashboard from "./pages/JewellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/api/products")
      .then((response) => {
        setProducts(response.data.products || []);
      })
      .catch((err) => {
        console.error("Products fetch error:", err);
        setError("Unable to load products.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Routes>
      <Route
        path="/admin-dashboard"
        element={<AdminDashboard />}
      />
      <Route
        path="/customer-enquiries"
        element={<CustomerEnquiries />}
      />

      <Route
        path="/jeweller-dashboard"
        element={<JewellerDashboard />}
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/customer-dashboard"
        element={<CustomerDashboard />}
      />

      <Route path="/" element={
        <div>
          {/* Navigation */}
          <nav className="navbar">
            <h2 className="logo">Gold<span>Biz</span></h2>
            <div className="nav-links">
              <a href="/">Home</a>
              <a href="#collections">Collections</a>
              <a href="#about">About</a>
            </div>
            <div className="nav-buttons">
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/register" className="register-btn">Register</Link>
            </div>
          </nav>

          {/* Hero section */}
          <section className="hero">
            <div className="hero-content">
              <p className="tagline">TIMELESS ELEGANCE</p>
              <h1>Discover Jewellery That Tells Your Story</h1>
              <p>
                Explore beautiful jewellery collections from trusted
                jewellers and find something special for every moment.
              </p>
              <button
                className="explore-btn"
                onClick={() =>
                  document.getElementById("collections")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Collection
              </button>
            </div>
          </section>

          {/* Available Jewellery */}
          <section className="products-section" id="products">
            <h2>Available Jewellery</h2>
            <p>Explore jewellery from our verified jewellers.</p>

            {loading ? (
              <p>Loading products...</p>
            ) : error ? (
              <p>{error}</p>
            ) : products.length === 0 ? (
              <p>No products available yet.</p>
            ) : (
              <div className="product-list">
                {products.map((product) => (
                  <div className="product-card" key={product.product_id}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                      />
                    ) : (
                      <div className="product-placeholder">
                        No image available
                      </div>
                    )}

                    <h3>{product.product_name}</h3>
                    <p>{product.category} · {product.metal_type}</p>
                    <p>{product.weight_grams} g</p>
                    <strong>
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </strong>
                    <p>By {product.business_name}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Categories */}
          <section className="categories" id="collections">
            <h2>Explore Our Collections</h2>
            <p>Find jewellery that matches your style.</p>

            <div className="category-list">
              <div className="category-card">
                <img
                  src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600"
                  alt="Gold necklace"
                />
                <h3>Necklaces</h3>
              </div>

              <div className="category-card">
                <img
                  src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600"
                  alt="Gold earrings"
                />
                <h3>Earrings</h3>
              </div>

              <div className="category-card">
                <img
                  src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600"
                  alt="Gold rings"
                />
                <h3>Rings</h3>
              </div>

              <div className="category-card">
                <img
                  src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"
                  alt="Gold bangles"
                />
                <h3>Bangles</h3>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="about" id="about">
            <h2>Your Jewellery, Your Choice</h2>
            <p>
              Discover trusted jewellers, explore their collections,
              connect directly with sellers and even sell your old gold.
            </p>
          </section>

          {/* Footer */}
          <footer>
            <h2>GoldBiz</h2>
            <p>Your trusted jewellery marketplace.</p>
            <p>© 2026 GoldBiz. All rights reserved.</p>
          </footer>
        </div>
      } />
    </Routes>
  );
}

export default App;
