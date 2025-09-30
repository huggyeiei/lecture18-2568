import { Router, type Request, type Response } from "express";
import { users, enrollments, reset_enrollments, students } from "../db/db.js";
import {
  authenticateToken,
  requireAdmin,
  requireStudentOwner,
  requireAdminOrOwner,
} from "../middlewares/authenticateToken.js";

const router = Router();

router.use(authenticateToken);

const isValidCourseId = (v: unknown): v is string =>
  typeof v === "string" && v.length === 6;

router.post("/reset", requireAdmin, (_req: Request, res: Response) => {
  try {
    reset_enrollments();
    return res.status(200).json({
      success: true,
      message: "enrollments database has been reset",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

router.get("/", requireAdmin, (_req, res: Response) => {
  try {
    const data = users
      .filter((u) => u.role === "STUDENT" && !!u.studentId)
      .map((u) => {
        const list = enrollments.filter((e) => e.studentId === u.studentId);
        return {
          studentId: u.studentId,
          courses: list.map((e) => ({ courseId: e.courseId })),
        };
      });

    return res.status(200).json({
      success: true,
      message: "Enrollments Information",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

router.get("/:studentId", requireAdminOrOwner, (req, res: Response) => {
  try {
    const studentId = req.params.studentId as string;

    const student = students.find((s) => s.studentId === studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const list = enrollments.filter((e) => e.studentId === studentId);
    return res.status(200).json({
      success: true,
      message: "Student enrollments",
      data: { studentId, courses: list.map((e) => ({ courseId: e.courseId })) },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err,
    });
  }
});

router.post("/:studentId", requireStudentOwner, (req, res: Response) => {
  try {
    const studentId = req.params.studentId as string; 
    const { courseId, studentId: bodyStudentId } = (req.body ?? {}) as {
      courseId?: unknown;
      studentId?: string;
    };

    if (bodyStudentId && bodyStudentId !== studentId) {
      return res.status(400).json({
        success: false,
        message: "studentId in body does not match studentId in URL parameters",
      });
    }

    if (!isValidCourseId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId. Must be a string of 6 characters.",
      });
    }

    const exists = enrollments.some(
      (e) => e.studentId === studentId && e.courseId === courseId
    );
    if (exists) {
      return res.status(409).json({ success: false, message: "Duplicate enrollment" });
    }

    enrollments.push({ studentId, courseId }); 

    const remain = enrollments
      .filter((e) => e.studentId === studentId)
      .map((e) => e.courseId);

    return res.status(201).json({
      success: true,
      message: `studentId ${studentId} added course ${courseId} successfully`,
      data: { studentId, courses: remain },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err,
    });
  }
});

router.delete("/:studentId", requireStudentOwner, (req, res: Response) => {
  try {
    const studentId = req.params.studentId as string;
    const { courseId, studentId: bodyStudentId } = (req.body ?? {}) as {
      courseId?: unknown;
      studentId?: string;
    };

    if (bodyStudentId && bodyStudentId !== studentId) {
      return res.status(400).json({
        success: false,
        message: "studentId in body does not match studentId in URL parameters",
      });
    }

    if (!isValidCourseId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId. Must be a string of 6 characters.",
      });
    }

    const idx = enrollments.findIndex(
      (e) => e.studentId === studentId && e.courseId === courseId
    );
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    enrollments.splice(idx, 1);

    const remain = enrollments
      .filter((e) => e.studentId === studentId)
      .map((e) => e.courseId);

    return res.status(200).json({
      success: true,
      message: `Student ${studentId} dropped course ${courseId} successfully`,
      data: { studentId, courses: remain },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err,
    });
  }
});

export default router;
