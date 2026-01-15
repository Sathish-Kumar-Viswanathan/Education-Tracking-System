import mongoose from "mongoose";

const Schema = mongoose.Schema;

const StudentSchema = new Schema(
  {
    FirstName: {
      type: String,
      required: true,
    },

    LastName: {
      type: String,
      required: true,
    },

    DateOfBirth: {
      type: Date,
      required: true,
    },

    Email: {
      type: String,
      required: true,
      unique: true,
    },

    FatherName: {
      type: String,
      required: true,
    },

    FatherPhone: {
      type: String,
      required: true,
    },

    RollNumber: {
      type: String,
      required: true,
      unique: true,
    },

    Department: {
      type: String,
      required: true,
    },

    YearOfStudy: {
      type: String,
      required: true,
    },

    Address: {
      type: String,
      required: true,
    },

    Password: {
      type: String,
      required: true,
    },

    IsDelete: {
      type: Boolean,
      default: false,
    },

    UserType: {
      type: String,
      default: "Student",
    },
  },
  { timestamps: true }
);

const StudentModel = mongoose.model("Student", StudentSchema);

export default StudentModel;
