
const express = require("express");

const app = express();

app.use(express.json());

const healthRoutes = require("./routes/health.routes");
const customerRoutes = require("./routes/customer.routes");
const jewellerRoutes = require("./routes/jeweller.routes");
const adminRoutes = require("./routes/admin.routes");
const productRoutes = require("./routes/product.routes");
const enquiryRoutes = require("./routes/enquiry.routes");
const chatRoutes = require("./routes/chat.routes");

app.use("/api", healthRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/jewellers", jewellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/chat", chatRoutes);

module.exports = app;
