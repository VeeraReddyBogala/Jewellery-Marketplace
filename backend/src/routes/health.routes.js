
const express = require("express");

const router = express.Router();

// GET API to check backend status
router.get("/health", (req, res) => {

    res.status(200).json({
        success: true,
        message: "Jewellery Marketplace Backend is running"
    });

});

module.exports = router;
