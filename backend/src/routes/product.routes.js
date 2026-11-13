
const express = require("express");
const db = require("../config/db");
const verifyJeweller = require("../middleware/jeweller.middleware");

const router = express.Router();


// Public Product Listing API
router.get("/", async (req, res) => {
    try {
        const [products] = await db.execute(
            `SELECT
                p.product_id,
                p.product_name,
                p.description,
                p.category,
                p.metal_type,
                p.purity,
                p.weight_grams,
                p.price,
                p.image_url,
                j.business_name,
                j.address
            FROM products p
            JOIN jewellers j
                ON p.jeweller_id = j.jeweller_id
            WHERE p.product_status = 'active'
            AND j.verification_status = 'approved'
            ORDER BY p.created_at DESC`
        );

        return res.status(200).json({
            success: true,
            count: products.length,
            products: products
        });

    } catch (error) {
        console.error("Get public products error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});


// Add Product API
router.post("/", verifyJeweller, async (req, res) => {
    try {
        const {
            product_name,
            description,
            category,
            metal_type,
            purity,
            weight_grams,
            price,
            image_url
        } = req.body;

        if (
            !product_name ||
            !category ||
            !metal_type
        ) {
            return res.status(400).json({
                success: false,
                message: "Product name, category and metal type are required"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO products
            (
                jeweller_id,
                product_name,
                description,
                category,
                metal_type,
                purity,
                weight_grams,
                price,
                image_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.jewellerId,
                product_name,
                description || null,
                category,
                metal_type,
                purity || null,
                weight_grams || null,
                price || null,
                image_url || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            product_id: result.insertId
        });

    } catch (error) {
        console.error("Add product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});


// View My Products API
router.get("/my-products", verifyJeweller, async (req, res) => {
    try {
        const jewellerId = req.user.jewellerId;

        const [products] = await db.execute(
            `SELECT *
             FROM products
             WHERE jeweller_id = ?
             ORDER BY created_at DESC`,
            [jewellerId]
        );

        return res.status(200).json({
            success: true,
            count: products.length,
            products: products
        });

    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});


// Update Product API
router.patch("/:id", verifyJeweller, async (req, res) => {
    try {
        const productId = req.params.id;
        const jewellerId = req.user.jewellerId;

        const allowedFields = [
            "product_name",
            "description",
            "category",
            "metal_type",
            "purity",
            "weight_grams",
            "price",
            "image_url",
            "product_status"
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one field to update"
            });
        }

        const [result] = await db.execute(
            `UPDATE products
             SET ${updates.join(", ")}
             WHERE product_id = ?
             AND jeweller_id = ?`,
            [...values, productId, jewellerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully"
        });

    } catch (error) {
        console.error("Update product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});


// Delete Product API
router.delete("/:id", verifyJeweller, async (req, res) => {
    try {
        const productId = req.params.id;
        const jewellerId = req.user.jewellerId;

        const [result] = await db.execute(
            `DELETE FROM products
             WHERE product_id = ?
             AND jeweller_id = ?`,
            [productId, jewellerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});



module.exports = router;
