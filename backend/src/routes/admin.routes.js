
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const verifyAdmin = require("../middleware/auth.middleware");

const router = express.Router();

// Admin login API
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find admin using email
        const [admins] = await db.execute(
            "SELECT * FROM admins WHERE email = ?",
            [email]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const admin = admins[0];

        // Compare entered password with stored hash
        const isPasswordValid = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                adminId: admin.admin_id,
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            token: token,
            admin: {
                admin_id: admin.admin_id,
                full_name: admin.full_name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});


// Get all pending jewellers
router.get("/jewellers/pending", verifyAdmin, async (req, res) => {
    try {
        const [jewellers] = await db.execute(
            `SELECT
                jeweller_id,
                business_name,
                phone,
                address,
                gst_number,
                verification_status,
                created_at
            FROM jewellers
            WHERE verification_status = 'pending'
            ORDER BY created_at DESC`
        );

        return res.status(200).json({
            success: true,
            count: jewellers.length,
            jewellers: jewellers
        });

    } catch (error) {
        console.error("Get pending jewellers error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});


 // Approve a jeweller
router.patch("/jewellers/:id/approve", verifyAdmin, async (req, res) => {
    try {
        const jewellerId = req.params.id;

        const [result] = await db.execute(
            `UPDATE jewellers
             SET verification_status = 'approved'
             WHERE jeweller_id = ?`,
            [jewellerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Jeweller not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Jeweller approved successfully"
        });

    } catch (error) {
        console.error("Approve jeweller error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});


// Reject a jeweller
router.patch("/jewellers/:id/reject", verifyAdmin, async (req, res) => {
    try {
        const jewellerId = req.params.id;

        const [result] = await db.execute(
            `UPDATE jewellers
             SET verification_status = 'rejected'
             WHERE jeweller_id = ?
             AND verification_status = 'pending'`,
            [jewellerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Pending jeweller not found or already reviewed"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Jeweller rejected successfully"
        });

    } catch (error) {
        console.error("Reject jeweller error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

module.exports = router;
