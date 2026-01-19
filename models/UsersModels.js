import mongoose from "mongoose";

const schema = mongoose.Schema;
const UsersSchema = new schema(
  {
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
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("Users", UsersSchema);
export default UserModel;
