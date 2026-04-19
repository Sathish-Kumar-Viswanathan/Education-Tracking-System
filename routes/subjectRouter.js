import express from "express";
import {
  GetAllSubjects,
  CreateSubject,
  DeleteSubject,
} from "../controller/subjectController.js";

const router = express.Router();

// Example route: Get all subjects
router.get("/", GetAllSubjects);
router.post("/create-subject", CreateSubject);
router.delete("/delete/:id", DeleteSubject);

export default router;
