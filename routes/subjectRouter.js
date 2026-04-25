import express from "express";
import {
  GetAllSubjects,
  CreateSubject,
  DeleteSubject,
  RestoreSubject,
  UpdateSubject,
} from "../controller/subjectController.js";

const router = express.Router();

// Example route: Get all subjects
router.get("/", GetAllSubjects);
router.post("/create-subject", CreateSubject);
router.delete("/delete/:id", DeleteSubject);
router.put("/restore/:id", RestoreSubject);
router.put("/update/:id", UpdateSubject);

export default router;
