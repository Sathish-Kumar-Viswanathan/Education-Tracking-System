import express from "express";
import {
  createAttendance,
  createBatchAttendance,
  getAttendanceByStudent,
  getAttendanceByStaff,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  getStudentDashboardAttendance,
} from "../controller/AttendanceController.js";

const router = express.Router();

// Create single attendance
router.post("/create", createAttendance);

// Create batch attendance
router.post("/batch", createBatchAttendance);

// Get attendance by student
router.get("/student/:studentId", getAttendanceByStudent);

// Get logged-in student's dashboard attendance by user id
router.get("/student-dashboard/user/:userId", getStudentDashboardAttendance);

// Get attendance by staff
router.get("/staff/:staffId", getAttendanceByStaff);

// Get attendance stats
router.get("/stats", getAttendanceStats);

// Update attendance
router.put("/update/:id", updateAttendance);

// Delete attendance
router.delete("/delete/:id", deleteAttendance);

export default router;
