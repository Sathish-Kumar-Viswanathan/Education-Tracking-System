import express from "express";
import { usersLogin } from "../controller/authController.js";

const Router = express.Router();

Router.post("/login", usersLogin);

export default Router;
