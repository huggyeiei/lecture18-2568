// src/middlewares/authenticateToken.ts
import { type Request, type Response, type NextFunction } from "express";
import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import type { CustomRequest, UserPayload } from "../libs/types.js";

// แนะนำให้ config dotenv แค่ใน index.ts ไม่ต้องในไฟล์นี้
const JWT_SECRET = process.env.JWT_SECRET || "this_is_my_secret";

export function authenticateToken(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  const auth = req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization header is required" });
  }

  const token = auth.slice(7).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = payload;
    req.token = token;
    return next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    if (err instanceof JsonWebTokenError) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

/* role guards สำหรับใช้ใน routes */
export function requireAdmin(req: CustomRequest, res: Response, next: NextFunction) {
  if (req.user?.role === "ADMIN") return next();
  return res.status(403).json({ success: false, message: "ADMIN only" });
}

export function requireStudentOwner(req: CustomRequest, res: Response, next: NextFunction) {
  if (req.user?.role === "STUDENT" && req.user.studentId === req.params.studentId) return next();
  return res.status(403).json({ success: false, message: "STUDENT owner only" });
}

export function requireAdminOrOwner(req: CustomRequest, res: Response, next: NextFunction) {
  const u = req.user;
  if (!u) return res.status(401).json({ success: false, message: "Missing token" });
  if (u.role === "ADMIN") return next();
  if (u.role === "STUDENT" && u.studentId === req.params.studentId) return next();
  return res.status(403).json({ success: false, message: "Forbidden" });
}
