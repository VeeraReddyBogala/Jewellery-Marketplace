
const express = require("express");
const db = require("../config/db");
const redisClient = require("../config/redis");
const verifyJeweller = require("../middleware/jeweller.middleware");

const router = express.Router();

const PRODUCT_CACHE_KEY = "products:public";
const CACHE_EXPIRY = 300; // 5 minutes


// Helper: Clear public product cache
async function clearProductCache() {
    try {
        if (redisClient.isReady) {
            await redisClient.del(PRODUCT_CACHE_KEY);
            console.log("Product cache cleared");
        }
    } catch (error) {
        console.error("Redis cache clearing error:", error.message);
    }
}


// Public Product Listing API
router.get("/", async (req, res) => {
    try {
        // 1. Check Redis cache
        if (redisClient.isReady) {
            try {
                const cachedProducts = await redisClient.get(PRODUCT_CACHE_KEY);

                if (cachedProducts) {
                    console.log("Products fetched from Redis");

                    const products = JSON.parse(cachedProducts);

                    return res.status(200).json({
                        success: true,
                        count: products.length,
                        products: products
                    });
                }
            } catch (error) {
                console.error("Redis cache read error:", error.message);
            }
        }

        // 2. If cache is empty, fetch from MySQL
        console.log("Products fetched from MySQL");

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

        // 3. Store products in Redis for 5 minutes
        if (redisClient.isReady) {
            try {
                await redisClient.setEx(
                    PRODUCT_CACHE_KEY,
                    CACHE_EXPIRY,
                    JSON.stringify(products)
                );
            } catch (error) {
                console.error("Redis cache write error:", error.message);
            }
        }

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

        // Clear cache because a new product was added
        await clearProductCache();

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

        // Clear cache because a product was updated
        await clearProductCache();

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

        // Clear cache because a product was deleted
        await clearProductCache();

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
