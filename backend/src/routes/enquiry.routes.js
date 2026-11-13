const express = require("express");
const router = express.Router();

const db = require("../config/db");
const verifyCustomer = require("../middleware/customer.middleware");
const verifyJeweller = require("../middleware/jeweller.middleware");

// Customer: Create a gold-selling enquiry
router.post("/", verifyCustomer, async (req, res) => {
    try {
        const {
            gold_item_type,
            purity,
            weight_grams,
            description,
            image_url
        } = req.body;

        if (!gold_item_type || !weight_grams) {
            return res.status(400).json({
                success: false,
                message: "Gold item type and weight are required."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO enquiries
            (customer_id, gold_item_type, purity, weight_grams, description, image_url)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.customerId,
                gold_item_type,
                purity || null,
                weight_grams,
                description || null,
                image_url || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Gold-selling enquiry submitted successfully.",
            enquiry_id: result.insertId
        });

    } catch (error) {
        console.error("Create enquiry error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Customer: View their own enquiries
router.get("/my-enquiries", verifyCustomer, async (req, res) => {
    try {
        const [enquiries] = await db.execute(
            "SELECT * FROM enquiries WHERE customer_id = ? ORDER BY created_at DESC",
            [req.user.customerId]
        );

        res.status(200).json({
            success: true,
            enquiries
        });

    } catch (error) {
        console.error("Get enquiries error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Jeweller: View pending gold-selling enquiries
router.get("/available", verifyJeweller, async (req, res) => {
    try {
        const [enquiries] = await db.execute(
            `SELECT e.enquiry_id, e.gold_item_type, e.purity,
                    e.weight_grams, e.description, e.image_url,
                    e.created_at, c.full_name
             FROM enquiries e
             JOIN customers c ON e.customer_id = c.customer_id
             WHERE e.status = 'pending'
             ORDER BY e.created_at DESC`
        );

        res.status(200).json({
            success: true,
            enquiries
        });

    } catch (error) {
        console.error("Available enquiries error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Jeweller: Respond to a gold-selling enquiry
router.post("/:id/respond", verifyJeweller, async (req, res) => {
    try {
        const { offered_price, message } = req.body;
        const enquiryId = req.params.id;

        if (!offered_price) {
            return res.status(400).json({
                success: false,
                message: "Offered price is required."
            });
        }

        const [enquiries] = await db.execute(
            "SELECT enquiry_id FROM enquiries WHERE enquiry_id = ? AND status = 'pending'",
            [enquiryId]
        );

        if (enquiries.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found or no longer available."
            });
        }

        await db.execute(
            `INSERT INTO enquiry_responses
            (enquiry_id, jeweller_id, offered_price, message)
            VALUES (?, ?, ?, ?)`,
            [
                enquiryId,
                req.user.jewellerId,
                offered_price,
                message || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Your offer has been submitted successfully."
        });

    } catch (error) {
        console.error("Enquiry response error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "You have already responded to this enquiry."
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Customer: View offers received for an enquiry
router.get("/:id/responses", verifyCustomer, async (req, res) => {
    try {
        const enquiryId = req.params.id;

        const [enquiries] = await db.execute(
            `SELECT enquiry_id FROM enquiries
             WHERE enquiry_id = ? AND customer_id = ?`,
            [enquiryId, req.user.customerId]
        );

        if (enquiries.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found."
            });
        }

        const [responses] = await db.execute(
            `SELECT er.response_id, er.offered_price,
                    er.message, er.response_status,
                    er.created_at, j.business_name, j.phone
             FROM enquiry_responses er
             JOIN jewellers j ON er.jeweller_id = j.jeweller_id
             WHERE er.enquiry_id = ?
             ORDER BY er.created_at DESC`,
            [enquiryId]
        );

        res.status(200).json({
            success: true,
            responses
        });

    } catch (error) {
        console.error("Get enquiry responses error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

module.exports = router;