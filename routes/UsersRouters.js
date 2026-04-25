import express from "express";
import {
  GetAllUsers,
  CreateUser,
  GetStaffUsers,
  GetAdminUsers,
  GetStudentUsers,
  SoftDeleteUser,
  RestoreUser,
  UpdateUser,
} from "../controller/UsersController.js";

const router = express.Router();

// Example route: Get all users
router.get("/", GetAllUsers);
router.get("/staff", GetStaffUsers);
router.get("/admin", GetAdminUsers);
router.get("/student", GetStudentUsers);
router.post("/create-user", CreateUser);
router.put("/soft-delete/:userId", SoftDeleteUser);
router.put("/restore/:userId", RestoreUser);
router.put("/update/:userId", UpdateUser);

export default router;
