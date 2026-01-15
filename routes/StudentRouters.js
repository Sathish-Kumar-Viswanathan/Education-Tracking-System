import express from "express";
import { getAllStudents, createStudent, getStudentById, updateStudent, deleteStudent } from "../controller/StudentController.js";
const Router = express.Router();

Router.get("/", getAllStudents);
Router.post("/create-student", createStudent);
Router.get("/student-by-id", getStudentById);
Router.put("/update-student", updateStudent);
Router.delete("/delete-student", deleteStudent);


export default Router;
