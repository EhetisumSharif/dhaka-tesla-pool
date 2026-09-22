const express = require("express");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Dhaka Tesla Pool API is running"
    });
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});