import mongoose from "mongoose";

const Schema = mongoose.Schema;

const StudentProfileUpdateRequestSchema = new Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    requestedProfile: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
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

const StudentProfileUpdateRequestModel = mongoose.model(
  "StudentProfileUpdateRequest",
  StudentProfileUpdateRequestSchema,
);

export default StudentProfileUpdateRequestModel;
