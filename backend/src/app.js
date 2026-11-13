
const express = require("express");

const app = express();

app.use(express.json());

const healthRoutes = require("./routes/health.routes");
const customerRoutes = require("./routes/customer.routes");
const jewellerRoutes = require("./routes/jeweller.routes");


app.use("/api", healthRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/jewellers", jewellerRoutes);


module.exports = app;
