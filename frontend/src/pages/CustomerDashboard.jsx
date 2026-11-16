
import { useNavigate } from "react-router-dom";
import "./CustomerDashboard.css";

function CustomerDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="customer-dashboard">
      <nav className="dashboard-navbar">
        <h2 className="logo">Gold<span>Biz</span></h2>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>

      <div className="dashboard-content">
        <h1>Welcome to GoldBiz!</h1>
        <p>
          Discover jewellery, connect with trusted jewellers
          and manage your gold-selling enquiries.
        </p>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h2>Browse Jewellery</h2>
            <p>Explore beautiful jewellery from verified jewellers.</p>
            <button onClick={() => navigate("/")}>
              Explore Products
            </button>
          </div>

          <div className="dashboard-card">
            <h2>My Gold Enquiries</h2>
            <p>Submit gold details and view your selling enquiries.</p>
            <button onClick={() => navigate("/customer-enquiries")}>
              Manage Enquiries
            </button>
          </div>

          <div className="dashboard-card">
            <h2>My Chats</h2>
            <p>Connect directly with jewellery sellers.</p>
            <button disabled>
              Coming Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
