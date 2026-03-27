import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import StudentRouters from "./routes/StudentRouters.js";
import UsersRouters from "./routes/UsersRouters.js";
import authRouter from "./routes/authRouter.js";
import timeTableRouter from "./routes/timeTableRouter.js";
import cors from "cors";
dotenv.config();
const PORT = process.env.PORT;

const app = express();
app.use(express.json());
app.use(cors());

// routers would be set up here
app.use("/api/students", StudentRouters);
app.use("/api/users", UsersRouters);
app.use("/api/auth", authRouter);
app.use("/api/time-table", timeTableRouter);

app.listen(PORT, async () => {
  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log(
        `Database is connected and Server is running on port ${PORT}`,
      );
    })
    .catch((error) => {
      console.log("Database connection failed", error);
    });
});
