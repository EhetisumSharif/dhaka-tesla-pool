const express = require("express");
const pool = require("./db");

const app = express();

const authRoutes = require("./routes/auth");
app.use(express.json());
app.use("/api/auth", authRoutes);

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Dhaka Tesla Pool API is running"
    });
});

app.get("/api/health/db", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database"
        );

        res.json({
            status: "ok",
            database: result.rows[0].database
        });
    } catch (error) {
        console.error("Database check failed:", error.message);

        res.status(503).json({
            status: "error",
            message: "Database unavailable"
        });
    }
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});