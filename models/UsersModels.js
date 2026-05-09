import mongoose from "mongoose";

const schema = mongoose.Schema;
const UsersSchema = new schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "student", "staff"],
    },
    rollNumber: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
    },
    yearOfStudy: {
      type: String,
      default: null,
    },
    department: {
      type: String,
      default: null,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const UserModel = mongoose.model("Users", UsersSchema);
export default UserModel;
