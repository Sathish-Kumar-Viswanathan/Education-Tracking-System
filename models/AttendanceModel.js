import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AttendanceSchema = new Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    period: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      default: "present",
    },
    remarks: {
      type: String,
      default: "",
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const AttendanceModel = mongoose.model("Attendance", AttendanceSchema);

export default AttendanceModel;
