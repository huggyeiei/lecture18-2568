import { Router, type Request, type Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import type { User, CustomRequest } from "../libs/types.js";

// import database
import { users, enrollments, reset_enrollments, students } from "../db/db.js";

import { authenticateToken } from "../middlewares/authenMiddleware.js";

import { checkRoleAdmin } from "./checkRoleAdmin.js";

const router = Router();

// GET /api/v2/enrollments
router.get("/", authenticateToken, checkRoleAdmin, (req: CustomRequest, res: Response) => {
    try{
         const enrollmentInfo = users
         .filter((u: User) => u.role === "STUDENT" && u.studentId) 
         .map((u: User) => {

            const studentEnrollment = enrollments.filter((e) => e.studentId === u.studentId);

            return {
                studentId: u.studentId,
                courses: studentEnrollment.map((en) => ({
                    courseId: en.courseId
                }))
            };
         });

            // return all users
        return res.status(200).json({
            success: true,
            message: "Enrollments Information",
            data: enrollmentInfo,
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something is wrong, please try again",
            error: err,
        });
    }
});

router.get("/:studentId", authenticateToken, (req: CustomRequest, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const user = req.user;


    const student = students.find(s => s.studentId === studentId);
    if (!student){
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }


    if(user?.role !== "ADMIN" && user?.studentId !== studentId){
      return res.status(403).json({
        success: false,
        message: "Forbidden access"
      });
    }




    return res.status(200).json({
      success: true,
      message: "Student Information",
      data: student
    });
    
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err
    });
  }
});


router.post("/:studentId", authenticateToken, (req: CustomRequest, res: Response) => {
  try {
    const studentId = req.params.studentId as string;
    const user = req.user;
    const courseId = req.body.courseId as string;
    const bodyStudentId = req.body.studentId;


    if(user?.role === "ADMIN" || (user?.role === "STUDENT" && user.studentId !== studentId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden access"
      });
    }

    if(bodyStudentId && bodyStudentId !== studentId){
      return res.status(400).json({
        success: false,
        message: "studentId in body does not match studentId in URL parameters"
      });
    }

    if (!courseId || typeof courseId !== "string" || courseId.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId. Must be a string of 6 characters."
      });
    }


    
    const enrollmentexists = enrollments.find(e => e.studentId === studentId && e.courseId === courseId);
    if(enrollmentexists){
      return res.status(409).json({
        success: false,
        message: "studentId && courseId already exist"
      });

    }

    const newEnrollment = { studentId: studentId as string, courseId: courseId as string };
    enrollments.push(newEnrollment);
    

    const remain = enrollments
      .filter(e => e.studentId === studentId)
      .map( e => 
         e.courseId
      );

    return res.status(201).json({
      success: true,
      message: `studentId ${studentId} && courseId ${courseId} has been added successfully`,
      data: {
        studentId: studentId,
        courseId: remain
      }
    });
    
  } catch(err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err
    });
  }

});

// POST /api/v2/enrollments/reset
router.post("/reset", authenticateToken, checkRoleAdmin, (req: Request, res: Response) => {
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

router.delete("/:studentId", authenticateToken, (req: CustomRequest, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const user = req.user;
    const courseId = req.body.courseId;
    const bodyStudentId = req.body.studentId;

    if(!user || user.role !== "STUDENT" || user.studentId !== studentId){
      return res.status(403).json({
        success: false,
        message: "You are not allowed to modify another student's data"
      });
    }

    if(bodyStudentId && bodyStudentId !== studentId){
      return res.status(400).json({
        success: false,
        message: "studentId in body does not match studentId in URL parameters"
      });
    }

    if(!courseId || typeof courseId !== "string" || courseId.length !== 6){
      return res.status(400).json({
        success: false,
        message: "Invalid courseId. Must be a string of 6 characters."
      });
    }

    const enrollmentIndex = enrollments.findIndex( e => e.studentId === studentId && e.courseId === courseId);

    if (enrollmentIndex === -1){
      return res.status(404).json({
        success: false,
        message: "Enrollment doesn't exist"
      });
    }

    enrollments.splice(enrollmentIndex,1);

    const remain = enrollments
      .filter(e => e.studentId === studentId)
      .map( e => 
         e.courseId
      );

    return res.status(200).json({
      success: true,
      message: `Student ${studentId} && Course ${courseId} has been deleted successfully`,
      data: {
        studentId: studentId,
        courseId: remain
      }
    });

  } catch (err){
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err
    });
  }

});

export default router;