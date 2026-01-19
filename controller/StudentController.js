import StudentModel from "../models/StudentModels.js";
import { Messages } from "../utils/Messages.js";
import { statusCodes } from "../utils/StatusCodes.js";

export const createStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      fatherName,
      fatherPhone,
      rollNumber,
      department,
      yearOfStudy,
      address,
      userId,
    } = req.body;

    const newStudent = await StudentModel.create({
      firstName,
      lastName,
      dateOfBirth,
      fatherName,
      fatherPhone,
      rollNumber,
      department,
      yearOfStudy,
      address,
      userId,
    });

    res.status(statusCodes.CREATED).json({
      message: Messages.StudentCreatedSuccessfully,
      student: newStudent,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.ErrorRetrievingStudents, error });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const AllStudents = await StudentModel.find({ IsDelete: false });
    console.log(AllStudents);

    if (AllStudents.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.NoStudentsFound });
    }

    res.status(statusCodes.SUCCESS).json(AllStudents);
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.ErrorRetrievingStudents, error });
  }
};

export const getStudentById = (req, res) => {
  res.send("Get student by ID");
};

export const updateStudent = (req, res) => {
  res.send("Update student details");
};

export const deleteStudent = (req, res) => {
  res.send("Delete a student");
};
