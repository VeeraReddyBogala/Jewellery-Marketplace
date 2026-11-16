
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./JewellerDashboard.css";

function JewellerDashboard() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // Gold-selling enquiries
  const [enquiries, setEnquiries] = useState([]);
  const [offers, setOffers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  // Jewellery products
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [productForm, setProductForm] = useState({
    product_name: "",
    description: "",
    category: "",
    metal_type: "",
    purity: "",
    weight_grams: "",
    price: "",
    image_url: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch available gold-selling enquiries
  const fetchEnquiries = async () => {
    try {
      const response = await axios.get(
        "/api/enquiries/available",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEnquiries(response.data.enquiries || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load available enquiries."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch jeweller's own products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "/api/products/my-products",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setProducts(response.data.products || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load your products."
      );
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "jeweller") {
      navigate("/login");
      return;
    }

    fetchEnquiries();
    fetchProducts();
  }, []);

  // Handle product form changes
  const handleProductChange = (e) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value
    });
  };

  // Reset product form
  const resetProductForm = () => {
    setProductForm({
      product_name: "",
      description: "",
      category: "",
      metal_type: "",
      purity: "",
      weight_grams: "",
      price: "",
      image_url: ""
    });

    setEditingProductId(null);
  };

  // Add or update a product
  const handleProductSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setProductSubmitting(true);

    const productData = {
      ...productForm,
      weight_grams: productForm.weight_grams
        ? Number(productForm.weight_grams)
        : null,
      price: productForm.price
        ? Number(productForm.price)
        : null
    };

    try {
      if (editingProductId) {
        await axios.patch(
          `/api/products/${editingProductId}`,
          productData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setSuccess("Product updated successfully!");
      } else {
        await axios.post(
          "/api/products",
          productData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setSuccess("Product added successfully!");
      }

      resetProductForm();
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save product."
      );
    } finally {
      setProductSubmitting(false);
    }
  };

  // Load product details into the form for editing
  const handleEditProduct = (product) => {
    setEditingProductId(product.product_id);

    setProductForm({
      product_name: product.product_name || "",
      description: product.description || "",
      category: product.category || "",
      metal_type: product.metal_type || "",
      purity: product.purity || "",
      weight_grams: product.weight_grams ?? "",
      price: product.price ?? "",
      image_url: product.image_url || ""
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Delete a product
  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await axios.delete(
        `/api/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess("Product deleted successfully!");
      await fetchProducts();

      if (editingProductId === productId) {
        resetProductForm();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete product."
      );
    }
  };

  // Handle enquiry offer form changes
  const handleOfferChange = (enquiryId, field, value) => {
    setOffers((previousOffers) => ({
      ...previousOffers,
      [enquiryId]: {
        ...previousOffers[enquiryId],
        [field]: value
      }
    }));
  };

  // Submit an offer for a gold-selling enquiry
  const handleSubmitOffer = async (e, enquiryId) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const offer = offers[enquiryId] || {};

    if (!offer.offered_price || Number(offer.offered_price) <= 0) {
      setError("Please enter a valid offered price.");
      return;
    }

    setSubmittingId(enquiryId);

    try {
      await axios.post(
        `/api/enquiries/${enquiryId}/respond`,
        {
          offered_price: Number(offer.offered_price),
          message: offer.message || ""
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess(`Offer submitted for enquiry #${enquiryId}.`);

      setOffers((previousOffers) => ({
        ...previousOffers,
        [enquiryId]: {
          offered_price: "",
          message: ""
        }
      }));

      await fetchEnquiries();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to submit your offer."
      );
    } finally {
      setSubmittingId(null);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="jeweller-dashboard">

      <nav className="jeweller-navbar">
        <h2 className="logo">
          Gold<span>Biz</span>
        </h2>

        <button onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <main className="jeweller-content">

        <h1>Jeweller Dashboard</h1>

        <p>
          Manage your jewellery collection and customer enquiries.
        </p>

        {error && (
          <p className="jeweller-error">{error}</p>
        )}

        {success && (
          <p className="jeweller-success">{success}</p>
        )}

        {/* ADD OR EDIT PRODUCTS */}

        <section className="product-management">

          <h2>
            {editingProductId
              ? "Edit Jewellery Product"
              : "Add New Jewellery Product"}
          </h2>

          <form
            className="product-form"
            onSubmit={handleProductSubmit}
          >

            <label>Product Name</label>
            <input
              type="text"
              name="product_name"
              placeholder="Example: 22K Gold Necklace"
              value={productForm.product_name}
              onChange={handleProductChange}
              required
            />

            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe your jewellery product"
              value={productForm.description}
              onChange={handleProductChange}
            />

            <label>Category</label>
            <select
              name="category"
              value={productForm.category}
              onChange={handleProductChange}
              required
            >
              <option value="">Select category</option>
              <option value="Necklaces">Necklaces</option>
              <option value="Earrings">Earrings</option>
              <option value="Rings">Rings</option>
              <option value="Bangles">Bangles</option>
              <option value="Chains">Chains</option>
              <option value="Other">Other</option>
            </select>

            <label>Metal Type</label>
            <select
              name="metal_type"
              value={productForm.metal_type}
              onChange={handleProductChange}
              required
            >
              <option value="">Select metal type</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Platinum">Platinum</option>
            </select>

            <label>Purity</label>
            <select
              name="purity"
              value={productForm.purity}
              onChange={handleProductChange}
            >
              <option value="">Select purity</option>
              <option value="24K">24K</option>
              <option value="22K">22K</option>
              <option value="18K">18K</option>
              <option value="14K">14K</option>
              <option value="925">925</option>
              <option value="Other">Other</option>
            </select>

            <label>Weight (grams)</label>
            <input
              type="number"
              name="weight_grams"
              min="0.01"
              step="0.01"
              placeholder="Enter weight"
              value={productForm.weight_grams}
              onChange={handleProductChange}
            />

            <label>Price (₹)</label>
            <input
              type="number"
              name="price"
              min="0.01"
              step="0.01"
              placeholder="Enter product price"
              value={productForm.price}
              onChange={handleProductChange}
            />

            <label>Product Image URL</label>
            <input
              type="url"
              name="image_url"
              placeholder="Paste product image URL"
              value={productForm.image_url}
              onChange={handleProductChange}
            />

            <div className="product-form-actions">

              <button
                type="submit"
                disabled={productSubmitting}
              >
                {productSubmitting
                  ? "Saving..."
                  : editingProductId
                  ? "Update Product"
                  : "Add Product"}
              </button>

              {editingProductId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                >
                  Cancel Edit
                </button>
              )}

            </div>

          </form>
        </section>

        {/* MY PRODUCTS */}

        <section className="my-products">

          <h2>My Jewellery Products</h2>

          {productsLoading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p>You haven't added any products yet.</p>
          ) : (
            <div className="product-management-list">

              {products.map((product) => (
                <div
                  className="managed-product-card"
                  key={product.product_id}
                >

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                    />
                  ) : (
                    <div className="managed-product-placeholder">
                      No Image Available
                    </div>
                  )}

                  <div className="managed-product-details">

                    <h3>{product.product_name}</h3>

                    <p>Category: {product.category}</p>
                    <p>Metal: {product.metal_type}</p>
                    <p>Purity: {product.purity || "Not specified"}</p>

                    <p>
                      Weight: {product.weight_grams ?? "Not specified"} grams
                    </p>

                    <p>
                      Price: {product.price != null
                        ? `₹${Number(product.price).toLocaleString("en-IN")}`
                        : "Contact for price"}
                    </p>

                    <p>
                      Status: {product.product_status}
                    </p>

                    <div className="managed-product-actions">

                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteProduct(product.product_id)
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

        {/* CUSTOMER GOLD-SELLING ENQUIRIES */}

        <section className="available-enquiries">

          <h2>Available Gold-Selling Enquiries</h2>

          {loading ? (
            <p>Loading enquiries...</p>
          ) : enquiries.length === 0 ? (
            <p>There are no pending enquiries at the moment.</p>
          ) : (
            <div className="jeweller-enquiry-list">

              {enquiries.map((enquiry) => (
                <div
                  className="jeweller-enquiry-card"
                  key={enquiry.enquiry_id}
                >

                  <h3>{enquiry.gold_item_type}</h3>

                  <p>
                    Customer: {enquiry.customer_name || "Customer"}
                  </p>

                  <p>Purity: {enquiry.purity}</p>

                  <p>Weight: {enquiry.weight_grams} grams</p>

                  <p>
                    Description: {enquiry.description || "Not provided"}
                  </p>

                  <form
                    onSubmit={(e) =>
                      handleSubmitOffer(e, enquiry.enquiry_id)
                    }
                  >

                    <label>Offer Price (₹)</label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="Enter your offered price"
                      value={
                        offers[enquiry.enquiry_id]?.offered_price || ""
                      }
                      onChange={(e) =>
                        handleOfferChange(
                          enquiry.enquiry_id,
                          "offered_price",
                          e.target.value
                        )
                      }
                    />

                    <label>Message</label>

                    <textarea
                      placeholder="Write a message to the customer"
                      value={
                        offers[enquiry.enquiry_id]?.message || ""
                      }
                      onChange={(e) =>
                        handleOfferChange(
                          enquiry.enquiry_id,
                          "message",
                          e.target.value
                        )
                      }
                    />

                    <button
                      type="submit"
                      disabled={submittingId === enquiry.enquiry_id}
                    >
                      {submittingId === enquiry.enquiry_id
                        ? "Submitting..."
                        : "Submit Offer"}
                    </button>

                  </form>
                </div>
              ))}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default JewellerDashboard;
