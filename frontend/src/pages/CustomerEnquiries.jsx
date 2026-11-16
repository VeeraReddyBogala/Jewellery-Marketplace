
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CustomerEnquiries.css";

function CustomerEnquiries() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    gold_item_type: "",
    purity: "",
    weight_grams: "",
    description: ""
  });

  const [enquiries, setEnquiries] = useState([]);
  const [offers, setOffers] = useState({});
  const [viewingOffers, setViewingOffers] = useState({});
  const [offerLoading, setOfferLoading] = useState({});
  const [offerErrors, setOfferErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  // Fetch customer's enquiries
  const fetchEnquiries = async () => {
    try {
      const response = await axios.get(
        "/api/enquiries/my-enquiries",
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
        "Unable to load your enquiries."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "customer") {
      navigate("/login");
      return;
    }

    fetchEnquiries();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Submit a new gold-selling enquiry
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await axios.post(
        "/api/enquiries",
        {
          gold_item_type: formData.gold_item_type,
          purity: formData.purity,
          weight_grams: Number(formData.weight_grams),
          description: formData.description
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess(
        "Your gold-selling enquiry was submitted successfully!"
      );

      setFormData({
        gold_item_type: "",
        purity: "",
        weight_grams: "",
        description: ""
      });

      await fetchEnquiries();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to submit your enquiry."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch offers for a particular enquiry
  const fetchOffers = async (enquiryId) => {
    setOfferLoading((previous) => ({
      ...previous,
      [enquiryId]: true
    }));

    setOfferErrors((previous) => ({
      ...previous,
      [enquiryId]: ""
    }));

    try {
      const response = await axios.get(
        `/api/enquiries/${enquiryId}/responses`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const receivedOffers =
        response.data.responses || response.data.offers || [];

      setOffers((previous) => ({
        ...previous,
        [enquiryId]: receivedOffers
      }));

      setViewingOffers((previous) => ({
        ...previous,
        [enquiryId]: true
      }));
    } catch (err) {
      setOfferErrors((previous) => ({
        ...previous,
        [enquiryId]:
          err.response?.data?.message ||
          "Unable to load offers."
      }));
    } finally {
      setOfferLoading((previous) => ({
        ...previous,
        [enquiryId]: false
      }));
    }
  };

  const toggleOffers = (enquiryId) => {
    if (viewingOffers[enquiryId]) {
      setViewingOffers((previous) => ({
        ...previous,
        [enquiryId]: false
      }));
    } else {
      fetchOffers(enquiryId);
    }
  };

  return (
    <div className="enquiries-page">
      <nav className="enquiries-navbar">
        <h2 onClick={() => navigate("/customer-dashboard")}>
          Gold<span>Biz</span>
        </h2>

        <button onClick={() => navigate("/customer-dashboard")}>
          Back to Dashboard
        </button>
      </nav>

      <div className="enquiries-content">
        <h1>Sell Your Old Gold</h1>
        <p>
          Submit your gold details and connect with interested jewellers.
        </p>

        <div className="enquiry-form-box">
          <h2>Submit a Gold-Selling Enquiry</h2>

          <form onSubmit={handleSubmit}>
            <label>Gold Item Type</label>
            <input
              type="text"
              name="gold_item_type"
              placeholder="Example: Gold chain, bangles, ring"
              value={formData.gold_item_type}
              onChange={handleChange}
              required
            />

            <label>Purity</label>
            <select
              name="purity"
              value={formData.purity}
              onChange={handleChange}
              required
            >
              <option value="">Select purity</option>
              <option value="24K">24K</option>
              <option value="22K">22K</option>
              <option value="18K">18K</option>
              <option value="14K">14K</option>
              <option value="Other">Other</option>
            </select>

            <label>Weight (grams)</label>
            <input
              type="number"
              name="weight_grams"
              placeholder="Enter weight in grams"
              min="0.01"
              step="0.01"
              value={formData.weight_grams}
              onChange={handleChange}
              required
            />

            <label>Description</label>
            <textarea
              name="description"
              placeholder="Provide additional details about your gold item"
              value={formData.description}
              onChange={handleChange}
            />

            {error && <p className="enquiry-error">{error}</p>}
            {success && <p className="enquiry-success">{success}</p>}

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Enquiry"}
            </button>
          </form>
        </div>

        <div className="my-enquiries">
          <h2>My Gold-Selling Enquiries</h2>

          {loading ? (
            <p>Loading enquiries...</p>
          ) : enquiries.length === 0 ? (
            <p>You haven't submitted any enquiries yet.</p>
          ) : (
            <div className="enquiry-list">
              {enquiries.map((enquiry) => (
                <div className="enquiry-card" key={enquiry.enquiry_id}>
                  <h3>{enquiry.gold_item_type}</h3>

                  <p>Purity: {enquiry.purity}</p>
                  <p>Weight: {enquiry.weight_grams} grams</p>
                  <p>
                    Description: {enquiry.description || "Not provided"}
                  </p>
                  <p>
                    Status: <strong>{enquiry.status}</strong>
                  </p>

                  <button
                    type="button"
                    onClick={() => toggleOffers(enquiry.enquiry_id)}
                    disabled={offerLoading[enquiry.enquiry_id]}
                  >
                    {offerLoading[enquiry.enquiry_id]
                      ? "Loading offers..."
                      : viewingOffers[enquiry.enquiry_id]
                      ? "Hide Offers"
                      : "View Offers"}
                  </button>

                  {offerErrors[enquiry.enquiry_id] && (
                    <p className="enquiry-error">
                      {offerErrors[enquiry.enquiry_id]}
                    </p>
                  )}

                  {viewingOffers[enquiry.enquiry_id] && (
                    <div className="offers-section">
                      <h4>Offers from Jewellers</h4>

                      {!offers[enquiry.enquiry_id] ||
                      offers[enquiry.enquiry_id].length === 0 ? (
                        <p>
                          No jewellers have submitted offers yet.
                        </p>
                      ) : (
                        offers[enquiry.enquiry_id].map((offer) => (
                          <div
                            className="offer-card"
                            key={offer.response_id}
                          >
                            <h4>
                              {offer.business_name || "Jeweller"}
                            </h4>

                            <h3>
                              ₹
                              {Number(offer.offered_price).toLocaleString(
                                "en-IN"
                              )}
                            </h3>

                            <p>
                              <strong>Message:</strong>{" "}
                              {offer.message || "No message provided."}
                            </p>

                            <p>
                              <strong>Contact:</strong>{" "}
                              {offer.phone || "Not available"}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerEnquiries;
