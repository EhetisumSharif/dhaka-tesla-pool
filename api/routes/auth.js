const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const pool = require("../db");

const router = express.Router();

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

module.exports = router;