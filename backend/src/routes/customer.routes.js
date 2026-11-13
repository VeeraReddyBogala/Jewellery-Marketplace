
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

const jwt = require("jsonwebtoken");


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


 // Customer Login API
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [customers] = await db.execute(
            "SELECT * FROM customers WHERE email = ?",
            [email]
        );

        if (customers.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const customer = customers[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            customer.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                customerId: customer.customer_id,
                role: "customer"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Customer login successful",
            token: token,
            customer: {
                customer_id: customer.customer_id,
                full_name: customer.full_name,
                email: customer.email
            }
        });

    } catch (error) {
        console.error("Customer login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});


module.exports = router;
