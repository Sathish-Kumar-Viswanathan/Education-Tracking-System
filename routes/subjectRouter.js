import express from "express";
import {
  GetAllSubjects,
  CreateSubject,
} from "../controller/subjectController.js";

const router = express.Router();

// Example route: Get all subjects
router.get("/", GetAllSubjects);
router.post("/create-subject", CreateSubject);

export default router;
