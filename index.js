import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import StudentRouters from "./routes/StudentRouters.js";
import UsersRouters from "./routes/UsersRouters.js";
import authRouter from "./routes/authRouter.js";
import timeTableRouter from "./routes/timeTableRouter.js";
import cors from "cors";
import bcrypt from "bcrypt";
import UserModel from "./models/UsersModels.js";
import subjectRouter from "./routes/subjectRouter.js";
import assignmentRouter from "./routes/assignmentRouter.js";
import attendanceRouter from "./routes/attendanceRouter.js";
import courseRouter from "./routes/courseRouter.js";
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
app.use("/api/subjects", subjectRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/courses", courseRouter);

const adminUser = {
  email: "admin@gmail.com",
  password: "Admin@123",
  role: "admin",
  name: "Admin User",
};
const createAdminUser = async (req, res) => {
  try {
    const { email, password, role, name } = adminUser;
    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, genSalt);
    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      role,
      name,
    });

    res.status(201).json({
      message: "Admin user created successfully",
      user: newUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log("Admin user already exists");
      return;
    } else {
      console.error("Error creating admin user:", error);
    }
  }
};

app.listen(PORT, async () => {
  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log(
        `Database is connected and Server is running on port ${PORT}`,
      );
      createAdminUser();
    })
    .catch((error) => {
      console.log("Database connection failed", error);
    });
});
