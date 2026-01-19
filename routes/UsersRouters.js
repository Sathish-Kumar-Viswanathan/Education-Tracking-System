import express from "express";
import { GetAllUsers, CreateUser } from "../controller/UsersController.js";

const router = express.Router();

// Example route: Get all users
router.get("/", GetAllUsers);

router.post("/create-user", CreateUser);

export default router;
