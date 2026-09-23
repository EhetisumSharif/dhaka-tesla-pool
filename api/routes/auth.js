const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/require-auth");

const router = express.Router();

const jwtSecret = process.env.JWT_SECRET;

if (!/^[a-f0-9]{64}$/i.test(jwtSecret || "")) {
    throw new Error("Set a valid JWT_SECRET in the root .env file");
}

const dummyPasswordHash = bcrypt.hashSync(
    "unused-login-comparison-password",
    12
);

const signupSchema = z.strictObject({
    name: z.string().trim().min(2).max(100),

    email: z.string()
        .trim()
        .toLowerCase()
        .max(254)
        .pipe(z.email()),

    password: z.string()
        .min(12)
        .refine((value) => !bcrypt.truncates(value), {
            message: "Password must be at most 72 UTF-8 bytes"
        })
});

router.post("/signup", async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid signup information",
            errors: parsed.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
    }

    const { name, email, password } = parsed.data;

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'PASSENGER')
       RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash]
        );

        return res.status(201).json({
            message: "Account created successfully",
            user: result.rows[0]
        });
    } catch (error) {
        if (
            error.code === "23505" &&
            error.constraint === "users_email_key"
        ) {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        console.error("Signup failed:", error.code);

        return res.status(500).json({
            message: "Could not create account"
        });
    }
});

const loginSchema = z.strictObject({
    email: z.string()
        .trim()
        .toLowerCase()
        .max(254)
        .pipe(z.email()),

    password: z.string()
        .min(1)
        .refine((value) => !bcrypt.truncates(value), {
            message: "Password must be at most 72 UTF-8 bytes"
        })
});

router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid login information"
        });
    }

    const { email, password } = parsed.data;

    try {
        const result = await pool.query(
            `SELECT id, name, email, role, password_hash
       FROM users WHERE email = $1`,
            [email]
        );

        const user = result.rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user ? user.password_hash : dummyPasswordHash
        );

        if (!user || !passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign({}, jwtSecret, {
            algorithm: "HS256",
            subject: user.id,
            issuer: "dhaka-tesla-pool-api",
            audience: "dhaka-tesla-pool-web",
            expiresIn: "1h"
        });

        res.cookie("tesla_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 1000
        });

        return res.json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login failed:", error.code || error.name);

        return res.status(500).json({
            message: "Could not log in"
        });
    }
});

router.get("/me", requireAuth, (req, res) => {
    res.json({
        user: req.user
    });
});

module.exports = router;