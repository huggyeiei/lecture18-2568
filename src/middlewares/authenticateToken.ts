import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "this_is_my_secret";

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization header is required" });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as Request["user"];
    req.user = payload!;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === "ADMIN") return next();
  return res.status(403).json({ success: false, message: "ADMIN only" });
}

export function requireStudentOwner(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === "STUDENT" && req.user.studentId === req.params.studentId) return next();
  return res.status(403).json({ success: false, message: "STUDENT owner only" });
}

export function requireAdminOrOwner(req: Request, res: Response, next: NextFunction) {
  const u = req.user;
  if (!u) return res.status(401).json({ success: false, message: "Missing token" });
  if (u.role === "ADMIN") return next();
  if (u.role === "STUDENT" && u.studentId === req.params.studentId) return next();
  return res.status(403).json({ success: false, message: "Forbidden" });
}
