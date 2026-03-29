import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    isDelte: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;
