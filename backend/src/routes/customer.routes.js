
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

// Customer registration API
router.post("/register", async (req, res) => {
    try {
        // Get customer details from request body
        const { full_name, email, phone, password } = req.body;

        // Check required fields
        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        // Check whether email already exists
        const [existingCustomer] = await db.execute(
            "SELECT customer_id FROM customers WHERE email = ?",
            [email]
        );

        if (existingCustomer.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert customer into database
        const [result] = await db.execute(
            `INSERT INTO customers
            (full_name, email, phone, password_hash)
            VALUES (?, ?, ?, ?)`,
            [full_name, email, phone || null, hashedPassword]
        );

        // Send success response
        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            customer_id: result.insertId
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

module.exports = router;
