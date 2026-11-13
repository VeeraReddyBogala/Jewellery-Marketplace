const express = require("express");
const router = express.Router();

const db = require("../config/db");
const verifyCustomer = require("../middleware/customer.middleware");

const verifyJeweller = require("../middleware/jeweller.middleware");

// Customer: Start a conversation with a jeweller
router.post("/conversations/:jewellerId", verifyCustomer, async (req, res) => {
    try {
        const jewellerId = req.params.jewellerId;
        const customerId = req.user.customerId;

        // Check whether the jeweller is approved
        const [jewellers] = await db.execute(
            `SELECT jeweller_id FROM jewellers
             WHERE jeweller_id = ? AND verification_status = 'approved'`,
            [jewellerId]
        );

        if (jewellers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Approved jeweller not found."
            });
        }

        // Create a conversation or reuse an existing one
        const [result] = await db.execute(
            `INSERT INTO conversations (customer_id, jeweller_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
             conversation_id = LAST_INSERT_ID(conversation_id)`,
            [customerId, jewellerId]
        );

        res.status(200).json({
            success: true,
            message: "Conversation started successfully.",
            conversation_id: result.insertId
        });

    } catch (error) {
        console.error("Start conversation error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Customer: Send a message
router.post("/conversations/:id/messages", verifyCustomer, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { message_text } = req.body;

        if (!message_text) {
            return res.status(400).json({
                success: false,
                message: "Message is required."
            });
        }

        // Check whether this conversation belongs to the customer
        const [conversations] = await db.execute(
            `SELECT conversation_id FROM conversations
             WHERE conversation_id = ? AND customer_id = ?`,
            [conversationId, req.user.customerId]
        );

        if (conversations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found."
            });
        }

        await db.execute(
            `INSERT INTO messages
             (conversation_id, sender_type, message_text)
             VALUES (?, 'customer', ?)`,
            [conversationId, message_text]
        );

        res.status(201).json({
            success: true,
            message: "Message sent successfully."
        });

    } catch (error) {
        console.error("Send message error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Jeweller: Send a reply
router.post("/conversations/:id/reply", verifyJeweller, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { message_text } = req.body;

        if (!message_text) {
            return res.status(400).json({
                success: false,
                message: "Message is required."
            });
        }

        // Check whether this conversation belongs to the jeweller
        const [conversations] = await db.execute(
            `SELECT conversation_id FROM conversations
             WHERE conversation_id = ? AND jeweller_id = ?`,
            [conversationId, req.user.jewellerId]
        );

        if (conversations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found."
            });
        }

        await db.execute(
            `INSERT INTO messages
             (conversation_id, sender_type, message_text)
             VALUES (?, 'jeweller', ?)`,
            [conversationId, message_text]
        );

        res.status(201).json({
            success: true,
            message: "Reply sent successfully."
        });

    } catch (error) {
        console.error("Jeweller reply error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Customer and Jeweller: View conversation messages
router.get("/conversations/:id/messages", async (req, res) => {
    try {
        const conversationId = req.params.id;

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Token is required."
            });
        }

        const token = authHeader.split(" ")[1];
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let query;
        let params;

        if (decoded.role === "customer") {
            query = `SELECT conversation_id FROM conversations
                     WHERE conversation_id = ? AND customer_id = ?`;
            params = [conversationId, decoded.customerId];

        } else if (decoded.role === "jeweller") {
            query = `SELECT conversation_id FROM conversations
                     WHERE conversation_id = ? AND jeweller_id = ?`;
            params = [conversationId, decoded.jewellerId];

        } else {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        const [conversations] = await db.execute(query, params);

        if (conversations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found."
            });
        }

        const [messages] = await db.execute(
            `SELECT message_id, sender_type, message_text, sent_at
             FROM messages
             WHERE conversation_id = ?
             ORDER BY sent_at ASC`,
            [conversationId]
        );

        res.status(200).json({
            success: true,
            messages
        });

    } catch (error) {
        console.error("Get messages error:", error);

        res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
});

module.exports = router;