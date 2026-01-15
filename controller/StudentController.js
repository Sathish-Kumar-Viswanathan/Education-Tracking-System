import StudentModel from "../models/StudentModels.js";
import { studentMessages } from "../utils/StudentMessages.js";
import { statusCodes } from "../utils/StatusCodes.js";

export const createStudent = async (req, res) => {
  try {
    const {
      FirstName,
      LastName,
      DateOfBirth,
      Email,
      FatherName,
      FatherPhone,
      RollNumber,
      Department,
      YearOfStudy,
      Address,
      Password,
    } = req.body;

    const newStudent = await StudentModel.create({
      FirstName,
      LastName,
      DateOfBirth,
      Email,
      FatherName,
      FatherPhone,
      RollNumber,
      Department,
      YearOfStudy,
      Address,
      Password,
    });

    res.status(statusCodes.CREATED).json({
      message: studentMessages.StudentCreatedSuccessfully,
      student: newStudent,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: studentMessages.ErrorRetrievingStudents, error });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const AllStudents = await StudentModel.find({ IsDelete: false });
    console.log(AllStudents);

    if (AllStudents.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: studentMessages.NoStudentsFound });
    }

    res.status(statusCodes.SUCCESS).json(AllStudents);
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: studentMessages.ErrorRetrievingStudents, error });
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
