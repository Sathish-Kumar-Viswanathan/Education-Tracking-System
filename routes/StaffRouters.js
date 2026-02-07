import express from express
import { GetAllStaffs, CreateStaff } from "../controller/StaffController.js";


const router = express.Router();

router.get("/", GetAllStaffs)

router.post("/create-staff", CreateStaff)