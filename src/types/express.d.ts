import "express";

export type Role = "ADMIN" | "STUDENT";

export interface UserPayload {
  username?: string;
  role: Role;
  studentId?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload;
    token?: string;
  }
}
