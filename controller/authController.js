import UserModel from "../models/UsersModels.js";
import { Messages } from "../utils/Messages.js";
import { statusCodes } from "../utils/StatusCodes.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const usersLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const checkCredentials = await UserModel.findOne({
      email,
      isDelete: false,
    });

    if (!checkCredentials) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: Messages.InvalidCredentials,
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      checkCredentials.password,
    );

    if (!isPasswordMatch) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: Messages.InvalidCredentials,
      });
    }

    const generateToken = jwt.sign(
      { id: checkCredentials._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.status(statusCodes.SUCCESS).json({
      message: Messages.LoginSuccessfully,
      token: generateToken,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: Messages.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
  }
};
