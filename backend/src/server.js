
const app = require("./app");
const db = require("./config/db");
const redisClient = require("./config/redis");

const PORT = 3000;

async function startServer() {
    try {
        // Connect to MySQL
        const connection = await db.getConnection();

        console.log("MySQL connected successfully!");

        connection.release();

        // Connect to Redis
        try {
            await redisClient.connect();
            console.log("Redis connected successfully!");
        } catch (redisError) {
            console.error("Redis connection failed:", redisError.message);
        }

        // Start Express server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
