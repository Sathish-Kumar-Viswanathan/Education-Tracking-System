import mongoose from "mongoose";

const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["general", "assignment", "attendance", "course"],
      default: "general",
    },
    targetRole: {
      type: String,
      enum: ["all", "student", "staff"],
      default: "student",
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    department: {
      type: String,
      default: "",
    },
    yearOfStudy: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const NotificationModel = mongoose.model("Notification", NotificationSchema);

export default NotificationModel;
