import express from "express";
import {
  getAllCourses,
  getStudentCoursesByUserId,
} from "../controller/courseController.js";

const router = express.Router();

router.get("/", getAllCourses);
router.get("/student/user/:userId", getStudentCoursesByUserId);

export default router;
