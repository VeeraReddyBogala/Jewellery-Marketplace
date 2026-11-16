
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [jewellers, setJewellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const token = localStorage.getItem("token");

  // Fetch pending jeweller registrations
  const fetchPendingJewellers = async () => {
    try {
      setError("");

      const response = await axios.get(
        "/api/admin/jewellers/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setJewellers(response.data.jewellers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load pending jewellers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "admin") {
      navigate("/login");
      return;
    }

    fetchPendingJewellers();
  }, []);

  // Approve or reject a jeweller
  const handleReview = async (jewellerId, action) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this jeweller?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setProcessingId(jewellerId);

    try {
      await axios.patch(
        `/api/admin/jewellers/${jewellerId}/${action}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess(
        `Jeweller ${action === "approve" ? "approved" : "rejected"} successfully!`
      );

      await fetchPendingJewellers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Unable to ${action} jeweller.`
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Admin logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-navbar">
        <h2>Gold<span>Biz</span></h2>
        <div>
          <span>Admin Panel</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="admin-content">
        <h1>Admin Dashboard</h1>
        <p>Manage and review jeweller registrations.</p>

        <div className="admin-summary">
          <div className="summary-card">
            <h3>Pending Registrations</h3>
            <h2>{jewellers.length}</h2>
          </div>
        </div>

        {error && (
          <p className="admin-error">{error}</p>
        )}

        {success && (
          <p className="admin-success">{success}</p>
        )}

        <section className="pending-section">
          <h2>Pending Jeweller Approvals</h2>

          {loading ? (
            <p>Loading registrations...</p>
          ) : jewellers.length === 0 ? (
            <p>No pending jeweller registrations.</p>
          ) : (
            <div className="jeweller-list">
              {jewellers.map((jeweller) => (
                <div
                  className="jeweller-card"
                  key={jeweller.jeweller_id}
                >
                  <h3>{jeweller.business_name}</h3>

                  <p>
                    <strong>Phone:</strong> {jeweller.phone}
                  </p>

                  <p>
                    <strong>Address:</strong> {jeweller.address}
                  </p>

                  <p>
                    <strong>GST Number:</strong>{" "}
                    {jeweller.gst_number || "Not provided"}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span className="pending-status">
                      {jeweller.verification_status}
                    </span>
                  </p>

                  <div className="approval-actions">
                    <button
                      className="approve-button"
                      onClick={() =>
                        handleReview(jeweller.jeweller_id, "approve")
                      }
                      disabled={processingId !== null}
                    >
                      {processingId === jeweller.jeweller_id
                        ? "Processing..."
                        : "Approve"}
                    </button>

                    <button
                      className="reject-button"
                      onClick={() =>
                        handleReview(jeweller.jeweller_id, "reject")
                      }
                      disabled={processingId !== null}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
