import mongoose from "mongoose";
import AssignmentModel from "../models/AssignmentModel.js";
import NotificationModel from "../models/NotificationModel.js";
import StudentAssignmentSubmissionModel from "../models/StudentAssignmentSubmissionModel.js";
import StudentModel from "../models/StudentModels.js";
import UserModel from "../models/UsersModels.js";
import { statusCodes } from "../utils/StatusCodes.js";

const resolveStudentByUserId = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  let student = await StudentModel.findOne({ userId, isDelete: false });

  if (student) {
    return student;
  }

  student = await StudentModel.findOne({ _id: userId, isDelete: false });

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

const buildAssignmentNotifications = async (student) => {
  const assignments = await AssignmentModel.find({
    department: student.department,
    yearOfStudy: student.yearOfStudy,
    dueDate: { $gte: new Date() },
    isDelete: false,
  }).sort({ dueDate: 1 });

  const submissions = await StudentAssignmentSubmissionModel.find({
    studentId: student._id,
    assignmentId: { $in: assignments.map((assignment) => assignment._id) },
    isDelete: false,
  });

  const submittedAssignmentIds = new Set(
    submissions.map((submission) => submission.assignmentId.toString()),
  );

  return assignments
    .filter((assignment) => !submittedAssignmentIds.has(assignment._id.toString()))
    .map((assignment) => ({
      _id: `assignment-${assignment._id}`,
      title: "Pending Assignment",
      message: `${assignment.title} for ${assignment.subject} is due on ${new Date(
        assignment.dueDate,
      ).toLocaleDateString()}.`,
      type: "assignment",
      isRead: false,
      createdAt: assignment.createdAt,
    }));
};

export const createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetRole,
      studentId,
      userId,
      department,
      yearOfStudy,
    } = req.body;

    if (!title || !message) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Title and message are required",
      });
    }

    const notification = await NotificationModel.create({
      title,
      message,
      type,
      targetRole,
      studentId: studentId || null,
      userId: userId || null,
      department: department || "",
      yearOfStudy: yearOfStudy || "",
    });

    res.status(statusCodes.CREATED).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error creating notification",
      error: error.message,
    });
  }
};

export const getStudentNotificationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const student = await resolveStudentByUserId(userId);

    if (!student) {
      return res.status(statusCodes.SUCCESS).json({
        message: "Notifications retrieved successfully",
        notifications: [],
        unreadCount: 0,
        count: 0,
      });
    }

    const storedNotifications = await NotificationModel.find({
      isDelete: false,
      targetRole: { $in: ["all", "student"] },
      $or: [
        { userId },
        { studentId: student._id },
        { department: student.department, yearOfStudy: student.yearOfStudy },
        { department: "", yearOfStudy: "" },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const assignmentNotifications = await buildAssignmentNotifications(student);
    const notifications = [...assignmentNotifications, ...storedNotifications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unreadCount = notifications.filter(
      (notification) => !notification.isRead,
    ).length;

    res.status(statusCodes.SUCCESS).json({
      message: "Notifications retrieved successfully",
      notifications,
      unreadCount,
      count: notifications.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error retrieving notifications",
      error: error.message,
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid notification ID",
      });
    }

    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true },
    );

    if (!notification || notification.isDelete) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Notification not found",
      });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error updating notification",
      error: error.message,
    });
  }
};
