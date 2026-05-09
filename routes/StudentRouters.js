import express from "express";
import {
  getAllStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentDashboardData,
  getStudentProfile,
  updateStudentProfile,
  getStudentByUserId,
  getStudentAttendanceDetails,
  getStudentProfileByUserId,
  updateStudentProfileByUserId,
} from "../controller/StudentController.js";

const Router = express.Router();

// Basic CRUD operations
Router.get("/", getAllStudents);
Router.post("/create-student", createStudent);

// Student by UserId endpoints (for logged-in students)
Router.get("/user/:userId", getStudentByUserId);
Router.get("/user/:userId/profile", getStudentProfileByUserId);
Router.put("/user/:userId/profile", updateStudentProfileByUserId);

Router.get("/:id", getStudentById);
Router.put("/:id", updateStudent);
Router.delete("/:id", deleteStudent);

// Dashboard endpoints
Router.get("/:studentId/dashboard", getStudentDashboardData);
Router.get("/:studentId/profile", getStudentProfile);
Router.put("/:studentId/profile", updateStudentProfile);

// Attendance endpoints
Router.get("/:studentId/attendance", getStudentAttendanceDetails);

export default Router;
