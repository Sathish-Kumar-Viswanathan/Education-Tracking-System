import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { statusCodes } from "../utils/StatusCodes.js";
import { Messages } from "../utils/Messages.js";
import AssignmentModel from "../models/AssignmentModel.js";
import StudentAssignmentSubmissionModel from "../models/StudentAssignmentSubmissionModel.js";
import StudentModel from "../models/StudentModels.js";
import UserModel from "../models/UsersModels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assignmentUploadDir = path.join(__dirname, "..", "uploads", "assignments");

const sanitizeFileName = (fileName = "assignment.pdf") =>
  String(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

const saveSubmissionPdf = async ({
  assignmentId,
  studentId,
  submissionUrl,
  submissionFileName,
}) => {
  if (!submissionUrl.startsWith("data:application/pdf;base64,")) {
    return submissionUrl;
  }

  await fs.mkdir(assignmentUploadDir, { recursive: true });

  const base64Content = submissionUrl.split(",")[1];
  const fileBuffer = Buffer.from(base64Content, "base64");
  const safeOriginalName = sanitizeFileName(submissionFileName);
  const fileName = `${assignmentId}-${studentId}-${Date.now()}-${safeOriginalName}`;
  const filePath = path.join(assignmentUploadDir, fileName);

  await fs.writeFile(filePath, fileBuffer);

  return `/uploads/assignments/${fileName}`;
};

const resolveStudentByUserId = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

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

// Create Assignment
export const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, department, yearOfStudy, staffId, subject } = req.body;

    if (!title || !description || !dueDate || !department || !yearOfStudy || !staffId || !subject) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "All fields are required",
      });
    }

    const newAssignment = await AssignmentModel.create({
      title,
      description,
      dueDate,
      department,
      yearOfStudy,
      staffId,
      subject,
    });

    res.status(statusCodes.CREATED).json({
      message: "Assignment created successfully",
      assignment: newAssignment,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error creating assignment",
      error: error.message,
    });
  }
};

// Get All Assignments
export const getAllAssignments = async (req, res) => {
  try {
    const { department, yearOfStudy, staffId } = req.query;
    const filter = { isDelete: false };

    if (department) filter.department = department;
    if (yearOfStudy) filter.yearOfStudy = yearOfStudy;
    if (staffId) filter.staffId = staffId;

    const assignments = await AssignmentModel.find(filter)
      .populate("staffId", "name email")
      .sort({ createdAt: -1 });

    res.status(statusCodes.SUCCESS).json({
      assignments,
      count: assignments.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error retrieving assignments",
      error: error.message,
    });
  }
};

// Get assignments for logged-in student
export const getStudentAssignmentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const student = await resolveStudentByUserId(userId);

    if (!student) {
      return res.status(statusCodes.SUCCESS).json({
        message: "Student assignments retrieved successfully",
        assignments: [],
        count: 0,
      });
    }

    const assignments = await AssignmentModel.find({
      department: student.department,
      yearOfStudy: student.yearOfStudy,
      isDelete: false,
    })
      .populate("staffId", "name email")
      .sort({ dueDate: 1, createdAt: -1 });

    const submissions = await StudentAssignmentSubmissionModel.find({
      studentId: student._id,
      assignmentId: { $in: assignments.map((assignment) => assignment._id) },
      isDelete: false,
    });

    const submissionsByAssignment = new Map(
      submissions.map((submission) => [
        submission.assignmentId.toString(),
        submission,
      ]),
    );

    let formattedAssignments = assignments.map((assignment) => {
      const submission = submissionsByAssignment.get(assignment._id.toString());

      return {
        ...assignment.toObject(),
        submission: submission || null,
        submissionStatus: submission?.status || "pending",
        isSubmitted: Boolean(submission),
      };
    });

    if (status) {
      formattedAssignments = formattedAssignments.filter(
        (assignment) => assignment.submissionStatus === status,
      );
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Student assignments retrieved successfully",
      student: {
        studentId: student._id,
        department: student.department,
        yearOfStudy: student.yearOfStudy,
      },
      assignments: formattedAssignments,
      count: formattedAssignments.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error retrieving student assignments",
      error: error.message,
    });
  }
};

// Get Assignment by ID
export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid assignment ID",
      });
    }

    const assignment = await AssignmentModel.findById(id)
      .populate("staffId", "name email");

    if (!assignment || assignment.isDelete) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Assignment not found",
      });
    }

    res.status(statusCodes.SUCCESS).json(assignment);
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error retrieving assignment",
      error: error.message,
    });
  }
};

// Update Assignment
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, department, yearOfStudy, subject } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid assignment ID",
      });
    }

    const assignment = await AssignmentModel.findByIdAndUpdate(
      id,
      {
        title,
        description,
        dueDate,
        department,
        yearOfStudy,
        subject,
      },
      { new: true }
    );

    if (!assignment) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Assignment not found",
      });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error updating assignment",
      error: error.message,
    });
  }
};

// Soft Delete Assignment
export const softDeleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid assignment ID",
      });
    }

    const assignment = await AssignmentModel.findByIdAndUpdate(
      id,
      { isDelete: true },
      { new: true }
    );

    if (!assignment) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Assignment not found",
      });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error deleting assignment",
      error: error.message,
    });
  }
};

// Restore Assignment
export const restoreAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid assignment ID",
      });
    }

    const assignment = await AssignmentModel.findByIdAndUpdate(
      id,
      { isDelete: false },
      { new: true }
    );

    if (!assignment) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Assignment not found",
      });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Assignment restored successfully",
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error restoring assignment",
      error: error.message,
    });
  }
};

// Get Submissions for an Assignment
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid assignment ID",
      });
    }

    const submissions = await StudentAssignmentSubmissionModel.find({
      assignmentId,
      isDelete: false,
    })
      .populate("studentId", "firstName lastName rollNumber")
      .populate("assignmentId", "title");

    res.status(statusCodes.SUCCESS).json({
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error retrieving submissions",
      error: error.message,
    });
  }
};

// Submit or resubmit an assignment
export const submitAssignment = async (req, res) => {
  try {
    const {
      assignmentId,
      studentId,
      userId,
      submissionUrl,
      submissionFileName,
      submissionMimeType,
    } = req.body;

    if (!assignmentId || !submissionUrl || (!studentId && !userId)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Assignment, student, and submission URL are required",
      });
    }

    if (
      submissionMimeType &&
      submissionMimeType !== "application/pdf"
    ) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Only PDF submissions are allowed",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid assignment ID",
      });
    }

    const assignment = await AssignmentModel.findOne({
      _id: assignmentId,
      isDelete: false,
    });

    if (!assignment) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Assignment not found",
      });
    }

    const student = userId
      ? await resolveStudentByUserId(userId)
      : await StudentModel.findOne({ _id: studentId, isDelete: false });

    if (!student) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Student not found",
      });
    }

    if (
      assignment.department !== student.department ||
      assignment.yearOfStudy !== student.yearOfStudy
    ) {
      return res.status(statusCodes.FORBIDDEN).json({
        message: "This assignment is not assigned to the student's class",
      });
    }

    const storedSubmissionUrl = await saveSubmissionPdf({
      assignmentId,
      studentId: student._id,
      submissionUrl,
      submissionFileName: submissionFileName || "assignment.pdf",
    });

    const submission = await StudentAssignmentSubmissionModel.findOneAndUpdate(
      {
        assignmentId,
        studentId: student._id,
        isDelete: false,
      },
      {
        assignmentId,
        studentId: student._id,
        submissionUrl: storedSubmissionUrl,
        submissionFileName: submissionFileName || "assignment.pdf",
        submissionMimeType: submissionMimeType || "application/pdf",
        submissionDate: new Date(),
        status: "submitted",
        marks: null,
        feedback: null,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(statusCodes.SUCCESS).json({
      message: "Assignment submitted successfully",
      submission,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error submitting assignment",
      error: error.message,
    });
  }
};

// Grade a student submission
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid submission ID",
      });
    }

    if (marks === undefined || marks === null || Number.isNaN(Number(marks))) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Valid marks are required",
      });
    }

    if (Number(marks) < 0 || Number(marks) > 10) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Assignment marks must be between 0 and 10",
      });
    }

    const submission = await StudentAssignmentSubmissionModel.findOneAndUpdate(
      {
        _id: submissionId,
        isDelete: false,
      },
      {
        marks: Number(marks),
        feedback: feedback || "",
        status: "graded",
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("studentId", "firstName lastName rollNumber")
      .populate("assignmentId", "title subject");

    if (!submission) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Submission not found",
      });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Submission graded successfully",
      submission,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error grading submission",
      error: error.message,
    });
  }
};

// Get All Submissions (for staff to view)
export const getAllSubmissions = async (req, res) => {
  try {
    const { staffId, status } = req.query;
    const filter = { isDelete: false };

    if (status) filter.status = status;

    let submissions = await StudentAssignmentSubmissionModel.find(filter)
      .populate("studentId", "firstName lastName rollNumber")
      .populate("assignmentId", "title subject staffId")
      .sort({ submissionDate: -1 });

    if (staffId) {
      submissions = submissions.filter(
        (sub) => sub.assignmentId.staffId.toString() === staffId
      );
    }

    res.status(statusCodes.SUCCESS).json({
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error retrieving submissions",
      error: error.message,
    });
  }
};
