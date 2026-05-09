import mongoose from "mongoose";

const Schema = mongoose.Schema;

const StudentAssignmentSubmissionSchema = new Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    submissionUrl: {
      type: String,
      required: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["submitted", "graded", "pending"],
      default: "submitted",
    },
    marks: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: null,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const StudentAssignmentSubmissionModel = mongoose.model(
  "StudentAssignmentSubmission",
  StudentAssignmentSubmissionSchema
);

export default StudentAssignmentSubmissionModel;
