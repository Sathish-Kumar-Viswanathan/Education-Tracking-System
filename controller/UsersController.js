import { statusCodes } from "../utils/StatusCodes.js";
import { Messages } from "../utils/Messages.js";
import UserModel from "../models/UsersModels.js";
import bcrypt from "bcrypt";

export const GetAllUsers = async (req, res) => {
  // Logic to get all users from the database
  try {
    const AllUsers = await UserModel.find({ isDelete: false });

    if (AllUsers.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.NotFound });
    }

    res.status(statusCodes.SUCCESS).json(AllUsers);
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ Messages: Messages.INTERNAL_SERVER_ERROR, error });
  }
};

export const CreateUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, genSalt);
    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      role,
    });
    res.status(statusCodes.CREATED).json({
      message: Messages.UserCreatedSuccessfully,
      user: newUser,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.INTERNAL_SERVER_ERROR, error });
  }
};
