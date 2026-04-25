import { statusCodes } from "../utils/StatusCodes.js";
import { Messages } from "../utils/Messages.js";
import UserModel from "../models/UsersModels.js";
import bcrypt from "bcrypt";

export const GetAllUsers = async (req, res) => {
  // Logic to get all users from the database
  try {
    const AllUsers = await UserModel.find();

    if (AllUsers.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.NotFound });
    }

    res
      .status(statusCodes.SUCCESS)
      .json({ users: AllUsers, totalCount: AllUsers.length });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ Messages: Messages.INTERNAL_SERVER_ERROR, error });
  }
};

export const CreateUser = async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, genSalt);
    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      role,
      name,
    });
    res.status(statusCodes.CREATED).json({
      message: Messages.UserCreatedSuccessfully,
      user: newUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(statusCodes.CONFLICT).json({
        message: Messages.EmailAlreadyRegistered,
      });
    }
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

export const GetStaffUsers = async (req, res) => {
  // Logic to get all staff users from the database
  try {
    const AllUsers = await UserModel.find({ role: "staff" });

    if (AllUsers.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.NotFound });
    }

    res
      .status(statusCodes.SUCCESS)
      .json({ users: AllUsers, totalCount: AllUsers.length });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ Messages: Messages.INTERNAL_SERVER_ERROR, error });
  }
};

export const GetAdminUsers = async (req, res) => {
  // Logic to get all admin users from the database
  try {
    const AllUsers = await UserModel.find({ role: "admin" });

    if (AllUsers.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.NotFound });
    }

    res
      .status(statusCodes.SUCCESS)
      .json({ users: AllUsers, totalCount: AllUsers.length });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ Messages: Messages.INTERNAL_SERVER_ERROR, error });
  }
};

export const GetStudentUsers = async (req, res) => {
  // Logic to get all student users from the database
  try {
    const AllUsers = await UserModel.find({ role: "student" });

    if (AllUsers.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.NotFound });
    }

    res
      .status(statusCodes.SUCCESS)
      .json({ users: AllUsers, totalCount: AllUsers.length });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ Messages: Messages.INTERNAL_SERVER_ERROR, error });
  }
};

export const SoftDeleteUser = async (req, res) => {
  // Logic to soft delete a user by marking isDelete as true
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.UserNotFound });
    }

    // Soft delete by setting isDelete to true
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isDelete: true },
      { new: true },
    );

    res.status(statusCodes.SUCCESS).json({
      message: Messages.UserDeletedSuccessfully,
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

export const RestoreUser = async (req, res) => {
  // Logic to restore a soft deleted user by marking isDelete as false
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.UserNotFound });
    }

    // Restore by setting isDelete to false
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isDelete: false },
      { new: true },
    );

    res.status(statusCodes.SUCCESS).json({
      message: Messages.UserRestoredSuccessfully,
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

export const UpdateUser = async (req, res) => {
  // Logic to update user details
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.UserNotFound });
    }

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { name, email, role },
      { new: true },
    );

    res.status(statusCodes.SUCCESS).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(statusCodes.CONFLICT).json({
        message: Messages.EmailAlreadyRegistered,
      });
    }
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.INTERNAL_SERVER_ERROR, error: error.message });
  }
};
