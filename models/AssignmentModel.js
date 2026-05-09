import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AssignmentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    yearOfStudy: {
      type: String,
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
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const AssignmentModel = mongoose.model("Assignment", AssignmentSchema);

export default AssignmentModel;
