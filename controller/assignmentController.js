import mongoose from "mongoose";
import { statusCodes } from "../utils/StatusCodes.js";
import { Messages } from "../utils/Messages.js";
import AssignmentModel from "../models/AssignmentModel.js";
import StudentAssignmentSubmissionModel from "../models/StudentAssignmentSubmissionModel.js";

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

// Get All Submissions (for staff to view)
export const getAllSubmissions = async (req, res) => {
  try {
    const { staffId, status } = req.query;
    const filter = { isDelete: false };

    if (status) filter.status = status;

    let submissions = await StudentAssignmentSubmissionModel.find(filter)
      .populate("studentId", "firstName lastName rollNumber")
      .populate("assignmentId", "title staffId")
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
