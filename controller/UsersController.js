import { statusCodes } from "../utils/StatusCodes.js";
import { Messages } from "../utils/Messages.js";
import UserModel from "../models/UsersModels.js";
import Subject from "../models/subjectModels.js";
import bcrypt from "bcrypt";

const getAssignedSubjectId = (assignedSubject) =>
  assignedSubject?.subject?.toString?.() || assignedSubject?.toString?.();

const normalizeAssignedSubjects = (assignedSubjects = []) =>
  assignedSubjects
    .filter(Boolean)
    .filter(
      (assignedSubject) =>
        getAssignedSubjectId(assignedSubject) &&
        assignedSubject.yearOfStudy &&
        assignedSubject.semester,
    )
    .map((assignedSubject) => ({
      subject: getAssignedSubjectId(assignedSubject),
      yearOfStudy: assignedSubject.yearOfStudy,
      semester: assignedSubject.semester,
    }));

const hasMoreThanTwoSubjectsPerYearSemester = (assignedSubjects = []) => {
  const countsByYearSemester = assignedSubjects.reduce((counts, assignment) => {
    const key = `${assignment.yearOfStudy}-${assignment.semester}`;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  return Object.values(countsByYearSemester).some((count) => count > 2);
};

const findSubjectAssignmentOwner = ({ subjectId, yearOfStudy, semester, excludedUserId }) =>
  UserModel.findOne({
    ...(excludedUserId ? { _id: { $ne: excludedUserId } } : {}),
    role: { $in: ["staff", "coordinator"] },
    isDelete: false,
    assignedSubjects: {
      $elemMatch: {
        subject: subjectId,
        yearOfStudy,
        semester,
      },
    },
  }).select("name email");

export const GetAllUsers = async (req, res) => {
  // Logic to get all users from the database
  try {
    const AllUsers = await UserModel.find().populate(
      "assignedSubjects.subject",
      "subjectName isDelete",
    );

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
    const {
      email,
      password,
      role,
      name,
      rollNumber,
      yearOfStudy,
      department,
      coordinatorYear,
    } = req.body;

    // Validate rollNumber for student role
    if (role === "student" && !rollNumber?.trim()) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Roll number is required for student role",
      });
    }

    // Validate yearOfStudy for student role
    if (role === "student" && !yearOfStudy?.trim()) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Year of study is required for student role",
      });
    }

    if (
      (role === "student" || role === "staff" || role === "coordinator") &&
      !department?.trim()
    ) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Department is required",
      });
    }

    if (role === "coordinator") {
      if (!coordinatorYear?.trim()) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Coordinator year is required",
        });
      }

      const existingCoordinator = await UserModel.findOne({
        role: "coordinator",
        coordinatorYear,
        isDelete: false,
      });

      if (existingCoordinator) {
        return res.status(statusCodes.CONFLICT).json({
          message: `Year ${coordinatorYear} already has a coordinator`,
        });
      }
    }

    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, genSalt);
    const newUserData = {
      email,
      password: hashedPassword,
      role,
      name,
      department:
        role === "student" || role === "staff" || role === "coordinator"
          ? department
          : null,
    };

    if (role === "student") {
      newUserData.rollNumber = rollNumber;
      newUserData.yearOfStudy = yearOfStudy;
    }

    if (role === "coordinator") {
      newUserData.coordinatorYear = coordinatorYear;
    }

    const newUser = await UserModel.create(newUserData);
    res.status(statusCodes.CREATED).json({
      message: Messages.UserCreatedSuccessfully,
      user: newUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.rollNumber) {
        return res.status(statusCodes.CONFLICT).json({
          message: "Roll number already exists",
        });
      }
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
    const AllUsers = await UserModel.find({
      role: { $in: ["staff", "coordinator"] },
    }).populate("assignedSubjects.subject", "subjectName isDelete");

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

export const AssignSubjectToStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subjectId, yearOfStudy, semester } = req.body;

    if (!subjectId) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Subject is required",
      });
    }

    if (!yearOfStudy || !semester) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Year and semester are required",
      });
    }

    const staff = await UserModel.findById(userId);
    if (!staff) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.UserNotFound });
    }

    if (staff.role !== "staff" && staff.role !== "coordinator") {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Subjects can only be assigned to staff or coordinator users",
      });
    }

    const subject = await Subject.findOne({ _id: subjectId, isDelete: false });
    if (!subject) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Active subject not found",
      });
    }

    const normalizedAssignments = normalizeAssignedSubjects(
      staff.assignedSubjects,
    );
    const assignedSubjectsForYearSemester = normalizedAssignments.filter(
      (assignedSubject) =>
        assignedSubject.yearOfStudy === yearOfStudy &&
        assignedSubject.semester === semester,
    );
    const assignedSubjectIds = assignedSubjectsForYearSemester.map(
      (assignedSubject) => assignedSubject.subject,
    );
    const isAlreadyAssigned = assignedSubjectIds.includes(subjectId);

    if (!isAlreadyAssigned && assignedSubjectIds.length >= 2) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message:
          "A staff member can handle a maximum of 2 subjects per year and semester",
      });
    }

    if (isAlreadyAssigned) {
      const populatedStaff = await staff.populate(
        "assignedSubjects.subject",
        "subjectName isDelete",
      );

      return res.status(statusCodes.SUCCESS).json({
        message: "Subject is already assigned to this staff member",
        staff: populatedStaff,
      });
    }

    const existingAssignmentOwner = await findSubjectAssignmentOwner({
      subjectId,
      yearOfStudy,
      semester,
      excludedUserId: userId,
    });

    if (existingAssignmentOwner) {
      return res.status(statusCodes.CONFLICT).json({
        message:
          "This subject is already assigned to another staff member for the selected year and semester",
      });
    }

    const updatedStaff = await UserModel.findByIdAndUpdate(
      userId,
      {
        assignedSubjects: [
          ...normalizedAssignments,
          { subject: subjectId, yearOfStudy, semester },
        ],
      },
      { new: true, runValidators: true },
    ).populate("assignedSubjects.subject", "subjectName isDelete");

    res.status(statusCodes.SUCCESS).json({
      message: "Subject assigned successfully",
      staff: updatedStaff,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

export const UpdateAssignedSubjectForStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      currentSubjectId,
      currentYearOfStudy,
      currentSemester,
      subjectId,
      yearOfStudy,
      semester,
    } = req.body;

    if (
      !currentSubjectId ||
      !currentYearOfStudy ||
      !currentSemester ||
      !subjectId ||
      !yearOfStudy ||
      !semester
    ) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Current and updated subject assignment details are required",
      });
    }

    const staff = await UserModel.findById(userId);
    if (!staff) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.UserNotFound });
    }

    if (staff.role !== "staff" && staff.role !== "coordinator") {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Subjects can only be updated for staff or coordinator users",
      });
    }

    const subject = await Subject.findOne({ _id: subjectId, isDelete: false });
    if (!subject) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Active subject not found",
      });
    }

    const currentAssignments = normalizeAssignedSubjects(staff.assignedSubjects);
    const assignmentIndex = currentAssignments.findIndex(
      (assignedSubject) =>
        assignedSubject.subject === currentSubjectId &&
        assignedSubject.yearOfStudy === currentYearOfStudy &&
        assignedSubject.semester === currentSemester,
    );

    const nextAssignment = { subject: subjectId, yearOfStudy, semester };
    const updatedAssignments =
      assignmentIndex === -1
        ? [...currentAssignments, nextAssignment]
        : currentAssignments.map((assignedSubject, index) =>
            index === assignmentIndex ? nextAssignment : assignedSubject,
          );

    const duplicateCount = updatedAssignments.filter(
      (assignedSubject) =>
        assignedSubject.subject === subjectId &&
        assignedSubject.yearOfStudy === yearOfStudy &&
        assignedSubject.semester === semester,
    ).length;

    if (duplicateCount > 1) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "This subject is already assigned for the selected year and semester",
      });
    }

    const existingAssignmentOwner = await findSubjectAssignmentOwner({
      subjectId,
      yearOfStudy,
      semester,
      excludedUserId: userId,
    });

    if (existingAssignmentOwner) {
      return res.status(statusCodes.CONFLICT).json({
        message:
          "This subject is already assigned to another staff member for the selected year and semester",
      });
    }

    if (hasMoreThanTwoSubjectsPerYearSemester(updatedAssignments)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message:
          "A staff member can handle a maximum of 2 subjects per year and semester",
      });
    }

    const populatedStaff = await UserModel.findByIdAndUpdate(
      userId,
      { assignedSubjects: updatedAssignments },
      { new: true, runValidators: true },
    ).populate("assignedSubjects.subject", "subjectName isDelete");

    res.status(statusCodes.SUCCESS).json({
      message: "Assigned subject updated successfully",
      staff: populatedStaff,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.INTERNAL_SERVER_ERROR, error: error.message });
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

    if (user.role === "coordinator" && user.coordinatorYear) {
      const existingCoordinator = await UserModel.findOne({
        _id: { $ne: userId },
        role: "coordinator",
        coordinatorYear: user.coordinatorYear,
        isDelete: false,
      });

      if (existingCoordinator) {
        return res.status(statusCodes.CONFLICT).json({
          message: `Year ${user.coordinatorYear} already has a coordinator`,
        });
      }
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
    const {
      name,
      email,
      role,
      rollNumber,
      yearOfStudy,
      department,
      coordinatorYear,
    } = req.body;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: Messages.UserNotFound });
    }

    if (role === "coordinator") {
      if (!coordinatorYear?.trim()) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Coordinator year is required",
        });
      }

      const existingCoordinator = await UserModel.findOne({
        _id: { $ne: userId },
        role: "coordinator",
        coordinatorYear,
        isDelete: false,
      });

      if (existingCoordinator) {
        return res.status(statusCodes.CONFLICT).json({
          message: `Year ${coordinatorYear} already has a coordinator`,
        });
      }
    }

    const update = {
      $set: {
        name,
        email,
        role,
        department:
          role === "student" || role === "staff" || role === "coordinator"
            ? department
            : null,
      },
      $unset: {},
    };

    if (role === "student") {
      update.$set.rollNumber = rollNumber;
      update.$set.yearOfStudy = yearOfStudy;
      update.$unset.coordinatorYear = "";
    } else {
      update.$unset.rollNumber = "";
      update.$unset.yearOfStudy = "";
      update.$unset.coordinatorYear = "";
    }

    if (role === "coordinator") {
      update.$set.coordinatorYear = coordinatorYear;
      delete update.$unset.coordinatorYear;
    }

    if (Object.keys(update.$unset).length === 0) {
      delete update.$unset;
    }

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    });

    res.status(statusCodes.SUCCESS).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.rollNumber) {
        return res.status(statusCodes.CONFLICT).json({
          message: "Roll number already exists",
        });
      }

      return res.status(statusCodes.CONFLICT).json({
        message: Messages.EmailAlreadyRegistered,
      });
    }
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.INTERNAL_SERVER_ERROR, error: error.message });
  }
};
