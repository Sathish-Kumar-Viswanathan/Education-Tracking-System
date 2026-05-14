import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AcademicMarksSchema = new Schema(
  {
    subject: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    internalOneMark: {
      type: Number,
      default: null,
    },
    internalTwoMark: {
      type: Number,
      default: null,
    },
    internalThreeMark: {
      type: Number,
      default: null,
    },
    semesterMark: {
      type: Number,
      default: null,
    },
  },
  { _id: false },
);

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

    semester: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    tenthMarkPercentage: {
      type: Number,
      default: 0,
    },

    tenthMarksheetUrl: {
      type: String,
      default: "",
    },

    twelfthMarkPercentage: {
      type: Number,
      default: 0,
    },

    twelfthMarksheetUrl: {
      type: String,
      default: "",
    },

    ugMarkPercentage: {
      type: Number,
      default: 0,
    },

    ugMarksheetUrl: {
      type: String,
      default: "",
    },

    internalOneMark: {
      type: Number,
      default: null,
    },

    internalTwoMark: {
      type: Number,
      default: null,
    },

    internalThreeMark: {
      type: Number,
      default: null,
    },

    semesterMark: {
      type: Number,
      default: null,
    },

    academicMarks: {
      type: [AcademicMarksSchema],
      default: [],
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
