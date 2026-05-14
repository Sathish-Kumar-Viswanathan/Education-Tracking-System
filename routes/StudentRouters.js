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
  getStudentProfileUpdateRequests,
  approveStudentProfileUpdateRequest,
  rejectStudentProfileUpdateRequest,
} from "../controller/StudentController.js";

const Router = express.Router();

// Basic CRUD operations
Router.get("/", getAllStudents);
Router.post("/create-student", createStudent);

// Student by UserId endpoints (for logged-in students)
Router.get("/user/:userId", getStudentByUserId);
Router.get("/user/:userId/profile", getStudentProfileByUserId);
Router.put("/user/:userId/profile", updateStudentProfileByUserId);
Router.get("/profile-update-requests", getStudentProfileUpdateRequests);
Router.put(
  "/profile-update-requests/:requestId/approve",
  approveStudentProfileUpdateRequest,
);
Router.put(
  "/profile-update-requests/:requestId/reject",
  rejectStudentProfileUpdateRequest,
);

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
