import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

import { users, reset_users } from "../db/db.js";
import { authenticateToken, requireAdmin } from "../middlewares/authenticateToken.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "forgot_secret";

/** GET /api/v2/users  (ADMIN only) */
router.get("/", authenticateToken, requireAdmin, (_req: Request, res: Response) => {
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

/** POST /api/v2/users/login */
router.post("/login", (req: Request, res: Response) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "username & password are required" });
    }

    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { username: user.username, studentId: user.studentId, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ success: true, message: "Login successful", token });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong.", error: err });
  }
});

/** POST /api/v2/users/logout  (optional – ยังไม่ได้ทำ token blacklist) */
router.post("/logout", (_req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    message: "POST /api/v2/users/logout is not implemented yet",
  });
});

/** POST /api/v2/users/reset  (ADMIN only) */
router.post("/reset", authenticateToken, requireAdmin, (_req: Request, res: Response) => {
  try {
    reset_users();
    return res.status(200).json({ success: true, message: "User database has been reset" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

export default router;
