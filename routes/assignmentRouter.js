import express from "express";
import {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  softDeleteAssignment,
  restoreAssignment,
  getAssignmentSubmissions,
  getAllSubmissions,
  getStudentAssignmentsByUserId,
  submitAssignment,
  gradeSubmission,
} from "../controller/assignmentController.js";

const Router = express.Router();

// Assignment routes
Router.post("/create-assignment", createAssignment);
Router.get("/", getAllAssignments);
Router.get("/student/user/:userId", getStudentAssignmentsByUserId);

// Submission routes
Router.post("/submissions/submit", submitAssignment);
Router.get("/submissions/staff/all", getAllSubmissions);
Router.get("/submissions/:assignmentId", getAssignmentSubmissions);
Router.put("/submissions/grade/:submissionId", gradeSubmission);

Router.get("/:id", getAssignmentById);
Router.put("/update/:id", updateAssignment);
Router.put("/soft-delete/:id", softDeleteAssignment);
Router.put("/restore/:id", restoreAssignment);

export default Router;
