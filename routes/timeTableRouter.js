import express from "express";
import {
  getTimeTable,
  createTimeTable,
  updateTimeTable,
  deleteTimeTable,
} from "../controller/timeTableController.js";
const Router = express.Router();
Router.get("/", getTimeTable);
Router.post("/create-time-table", createTimeTable);
Router.put("/update-time-table", updateTimeTable);
Router.delete("/delete-time-table", deleteTimeTable);

export default Router;
