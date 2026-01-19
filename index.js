import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import StudentRouters from "./routes/StudentRouters.js";
import UsersRouters from "./routes/UsersRouters.js";

dotenv.config();
const PORT = process.env.PORT;

const app = express();
app.use(express.json());

// routers would be set up here
app.use("/api/students", StudentRouters);
app.use("/api/users", UsersRouters);

app.listen(PORT, async () => {
  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log(
        `Database is connected and Server is running on port ${PORT}`
      );
    })
    .catch((error) => {
      console.log("Database connection failed", error);
    });
});
