
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

// Jeweller registration API
router.post("/register", async (req, res) => {
    try {
        // Get details from request body
        const {
            business_name,
            phone,
            address,
            gst_number,
            password
        } = req.body;

        // Validate required fields
        if (!business_name || !phone || !address || !password) {
            return res.status(400).json({
                success: false,
                message: "Business name, phone, address and password are required"
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        // Check whether phone number already exists
        const [existingJeweller] = await db.execute(
            "SELECT jeweller_id FROM jewellers WHERE phone = ?",
            [phone]
        );

        if (existingJeweller.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Phone number already registered"
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert jeweller details into MySQL
        const [result] = await db.execute(
            `INSERT INTO jewellers
            (business_name, phone, address, gst_number, password_hash)
            VALUES (?, ?, ?, ?, ?)`,
            [
                business_name,
                phone,
                address,
                gst_number || null,
                hashedPassword
            ]
        );

        // Send success response
        return res.status(201).json({
            success: true,
            message: "Jeweller registered successfully. Waiting for admin approval.",
            jeweller_id: result.insertId,
            verification_status: "pending"
        });

    } catch (error) {
        console.error("Jeweller registration error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Phone number or GST number already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

module.exports = router;
