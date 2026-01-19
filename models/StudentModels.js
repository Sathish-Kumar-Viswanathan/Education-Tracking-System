import mongoose from "mongoose";

const Schema = mongoose.Schema;

const StudentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    fatherName: {
      type: String,
      required: true,
    },

    fatherPhone: {
      type: String,
      required: true,
    },

    rollNumber: {
      type: String,
      required: true,
      unique: true,
    },

    department: {
      type: String,
      required: true,
    },

    yearOfStudy: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    isDelete: {
      type: Boolean,
      default: false,
    },

    userType: {
      type: String,
      default: "Student",
    },
  },
  { timestamps: true }
);

const StudentModel = mongoose.model("Student", StudentSchema);

export default StudentModel;
