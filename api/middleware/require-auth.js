const jwt = require("jsonwebtoken");
const { z } = require("zod");
const pool = require("../db");

const jwtSecret = process.env.JWT_SECRET;

if (!/^[a-f0-9]{64}$/i.test(jwtSecret || "")) {
    throw new Error("Set a valid JWT_SECRET in the root .env file");
}

async function requireAuth(req, res, next) {
    res.set("Cache-Control", "no-store");

    const token = req.cookies?.tesla_session;

    if (typeof token !== "string" || !token) {
        return res.status(401).json({
            message: "Please log in"
        });
    }

    let userId;

    try {
        const payload = jwt.verify(token, jwtSecret, {
            algorithms: ["HS256"],
            issuer: "dhaka-tesla-pool-api",
            audience: "dhaka-tesla-pool-web",
            maxAge: "1h"
        });

        userId = z.uuid().parse(payload.sub);
    } catch {
        return res.status(401).json({
            message: "Invalid or expired session"
        });
    }

    try {
        const result = await pool.query(
            "SELECT id, name, email, role FROM users WHERE id = $1",
            [userId]
        );

        if (!result.rows[0]) {
            return res.status(401).json({
                message: "Please log in"
            });
        }

        req.user = result.rows[0];
    } catch (error) {
        console.error(
            "Authentication check failed:",
            error.code || error.name
        );

        return res.status(503).json({
            message: "Authentication service unavailable"
        });
    }

    return next();
}

module.exports = requireAuth;