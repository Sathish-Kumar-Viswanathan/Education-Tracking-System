import AssignmentModel from "../models/AssignmentModel.js";
import AttendanceModel from "../models/AttendanceModel.js";
import StudentModel from "../models/StudentModels.js";
import Subject from "../models/subjectModels.js";
import UserModel from "../models/UsersModels.js";
import { statusCodes } from "../utils/StatusCodes.js";

const resolveStudentByUserId = async (userId) => {
  let student = await StudentModel.findOne({
    userId,
    isDelete: false,
  });

  if (student) {
    return student;
  }

  student = await StudentModel.findOne({
    _id: userId,
    isDelete: false,
  });

  if (student) {
    return student;
  }

  const user = await UserModel.findOne({
    _id: userId,
    role: "student",
    isDelete: false,
  });

  if (!user?.rollNumber) {
    return null;
  }

  student = await StudentModel.findOne({
    rollNumber: user.rollNumber,
    isDelete: false,
  });

  if (student && !student.userId) {
    student.userId = userId;
    await student.save();
  }

  return student;
};

const formatCourses = (courseNames) =>
  [...new Set(courseNames.filter(Boolean).map((course) => String(course).trim()))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((courseName) => ({ courseName }));

export const getStudentCoursesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const student = await resolveStudentByUserId(userId);

    if (!student) {
      return res.status(statusCodes.SUCCESS).json({
        message: "Student courses retrieved successfully",
        courses: [],
        count: 0,
      });
    }

    const assignmentSubjects = await AssignmentModel.distinct("subject", {
      department: student.department,
      yearOfStudy: student.yearOfStudy,
      isDelete: false,
    });

    const attendanceSubjects = await AttendanceModel.distinct("subject", {
      studentId: student._id,
      isDelete: false,
    });

    let courses = formatCourses([...assignmentSubjects, ...attendanceSubjects]);

    if (courses.length === 0) {
      const activeSubjects = await Subject.find({ isDelete: false }).select(
        "subjectName",
      );
      courses = formatCourses(
        activeSubjects.map((subject) => subject.subjectName),
      );
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Student courses retrieved successfully",
      student: {
        studentId: student._id,
        department: student.department,
        yearOfStudy: student.yearOfStudy,
      },
      courses,
      count: courses.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error retrieving student courses",
      error: error.message,
    });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const subjects = await Subject.find({ isDelete: false }).sort({
      subjectName: 1,
    });

    const courses = subjects.map((subject) => ({
      courseId: subject._id,
      courseName: subject.subjectName,
    }));

    res.status(statusCodes.SUCCESS).json({
      message: "Courses retrieved successfully",
      courses,
      count: courses.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error retrieving courses",
      error: error.message,
    });
  }
};
