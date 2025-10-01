import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, CustomRequest, UserPayload } from "../libs/types.js";
import { users, reset_users } from "../db/db.js";
import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "./checkRoleAdmin.js";

const router = Router();

router.get("/", authenticateToken, checkRoleAdmin, (req: CustomRequest, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Successful operation",
      data: users,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

router.post("/login", (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = users.find((u: User) => u.username === username && u.password === password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password!",
      });
    }

    const jwt_secret = process.env.JWT_SECRET || "forgot_secret";
    const token = jwt.sign(
      { username: user.username, studentId: user.studentId, role: user.role } as UserPayload,
      jwt_secret,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: err,
    });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  return res.status(500).json({
    success: false,
    message: "POST /api/v2/users/logout has not been implemented yet",
  });
});

router.post("/reset", (req: Request, res: Response) => {
  try {
    reset_users();
    return res.status(200).json({
      success: true,
      message: "User database has been reset",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

export default router;
