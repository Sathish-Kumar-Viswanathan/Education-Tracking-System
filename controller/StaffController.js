import mongoose from "mongoose";
import { statusCodes } from "../utils/StatusCodes";
import StaffModel from "../models/StaffModels";

export const GetAllStaffs = async (req, res) => {
  try {
    const allStaffs = await StaffModel.find({ IsDelete: false });

    if (allStaffs.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.StaffIsNotAvailable });
    }
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: Messages.INTERNAL_SERVER_ERROR,
    });
  }
};

export const CreateStaff = async (req, res) => {};
