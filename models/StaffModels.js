import mongoose from "mongoose";

const schema = mongoose.Schema;
const StaffSchema = new schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    dataOfBirth: {
      type: Date,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },
    emailId: {
      type: String,
      required: true,
    },
    dept: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },

    qualification: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const StaffModel = mongoose.model("Staff", StaffSchema);

export default StaffModel;
