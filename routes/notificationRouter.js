import express from "express";
import {
  createNotification,
  getStudentNotificationsByUserId,
  markNotificationAsRead,
} from "../controller/notificationController.js";

const Router = express.Router();

Router.post("/create", createNotification);
Router.get("/student/user/:userId", getStudentNotificationsByUserId);
Router.put("/read/:id", markNotificationAsRead);

export default Router;
