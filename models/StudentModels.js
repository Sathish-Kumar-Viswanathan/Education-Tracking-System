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
      default: "",
    },

    lastName: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    fatherName: {
      type: String,
      default: "",
    },

    fatherPhone: {
      type: String,
      default: "",
    },

    motherName: {
      type: String,
      default: "",
    },

    motherPhone: {
      type: String,
      default: "",
    },

    fatherOccupation: {
      type: String,
      default: "",
    },

    motherOccupation: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
      default: "",
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
      default: "",
    },

    tenthMarkPercentage: {
      type: Number,
      default: 0,
    },

    twelfthMarkPercentage: {
      type: Number,
      default: 0,
    },

    ugMarkPercentage: {
      type: Number,
      default: 0,
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
  { timestamps: true },
);

const StudentModel = mongoose.model("Student", StudentSchema);

export default StudentModel;
