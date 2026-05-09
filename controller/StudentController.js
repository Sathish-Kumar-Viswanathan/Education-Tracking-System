import StudentModel from "../models/StudentModels.js";
import UserModel from "../models/UsersModels.js";
import AttendanceModel from "../models/AttendanceModel.js";
import AssignmentModel from "../models/AssignmentModel.js";
import StudentAssignmentSubmissionModel from "../models/StudentAssignmentSubmissionModel.js";
import { Messages } from "../utils/Messages.js";
import { statusCodes } from "../utils/StatusCodes.js";

const splitName = (name = "") => {
  const [firstName = "", ...rest] = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName,
    lastName: rest.join(" "),
  };
};

const buildStudentProfile = (student) => ({
  studentId: student._id,
  firstName: student.firstName,
  lastName: student.lastName,
  dateOfBirth: student.dateOfBirth,
  email: student.email,
  phoneNumber: student.phoneNumber,
  address: student.address,
  fatherName: student.fatherName,
  fatherPhone: student.fatherPhone,
  fatherOccupation: student.fatherOccupation,
  motherName: student.motherName,
  motherPhone: student.motherPhone,
  motherOccupation: student.motherOccupation,
  tenthMarkPercentage: student.tenthMarkPercentage,
  twelfthMarkPercentage: student.twelfthMarkPercentage,
  ugMarkPercentage: student.ugMarkPercentage,
  rollNumber: student.rollNumber,
  department: student.department,
  yearOfStudy: student.yearOfStudy,
});

const buildUserBackedProfile = (user) => {
  const { firstName, lastName } = splitName(user.name);

  return {
    studentId: null,
    firstName,
    lastName,
    dateOfBirth: null,
    email: user.email,
    phoneNumber: "",
    address: "",
    fatherName: "",
    fatherPhone: "",
    fatherOccupation: "",
    motherName: "",
    motherPhone: "",
    motherOccupation: "",
    tenthMarkPercentage: 0,
    twelfthMarkPercentage: 0,
    ugMarkPercentage: 0,
    rollNumber: user.rollNumber || "",
    department: user.department || "",
    yearOfStudy: user.yearOfStudy || "",
  };
};

const cleanProfileUpdate = (profileData) => {
  const updateData = { ...profileData };

  if (updateData.dateOfBirth === "") {
    updateData.dateOfBirth = null;
  }

  ["tenthMarkPercentage", "twelfthMarkPercentage", "ugMarkPercentage"].forEach(
    (field) => {
      if (updateData[field] === "") {
        updateData[field] = 0;
      }
    },
  );

  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key],
  );

  return updateData;
};

export const createStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      phoneNumber,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
      rollNumber,
      department,
      yearOfStudy,
      address,
      userId,
      tenthMarkPercentage,
      twelfthMarkPercentage,
      ugMarkPercentage,
    } = req.body;

    const newStudent = await StudentModel.create({
      firstName,
      lastName,
      dateOfBirth,
      email,
      phoneNumber,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
      rollNumber,
      department,
      yearOfStudy,
      address,
      userId,
      tenthMarkPercentage: tenthMarkPercentage || 0,
      twelfthMarkPercentage: twelfthMarkPercentage || 0,
      ugMarkPercentage: ugMarkPercentage || 0,
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
    const { department, yearOfStudy } = req.query;
    const filter = { isDelete: { $ne: true } };
    const normalizedDepartment = String(department ?? "").trim();
    const normalizedYearOfStudy = String(yearOfStudy ?? "").trim();

    if (normalizedDepartment && normalizedDepartment.toLowerCase() !== "all") {
      filter.department = normalizedDepartment;
    }

    if (
      normalizedYearOfStudy &&
      normalizedYearOfStudy.toLowerCase() !== "all"
    ) {
      filter.yearOfStudy = normalizedYearOfStudy;
    }

    const AllStudents = await StudentModel.find(filter);

    res.status(statusCodes.SUCCESS).json({
      students: AllStudents,
      count: AllStudents.length,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.ErrorRetrievingStudents, error });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await StudentModel.findById(id);

    if (!student || student.isDelete) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Student not found" });
    }

    res.status(statusCodes.SUCCESS).json({
      student: student,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error retrieving student", error });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      phoneNumber,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
      rollNumber,
      department,
      yearOfStudy,
      address,
      tenthMarkPercentage,
      twelfthMarkPercentage,
      ugMarkPercentage,
    } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (fatherName) updateData.fatherName = fatherName;
    if (fatherPhone) updateData.fatherPhone = fatherPhone;
    if (fatherOccupation) updateData.fatherOccupation = fatherOccupation;
    if (motherName) updateData.motherName = motherName;
    if (motherPhone) updateData.motherPhone = motherPhone;
    if (motherOccupation) updateData.motherOccupation = motherOccupation;
    if (rollNumber) updateData.rollNumber = rollNumber;
    if (department) updateData.department = department;
    if (yearOfStudy) updateData.yearOfStudy = yearOfStudy;
    if (address) updateData.address = address;
    if (tenthMarkPercentage !== undefined)
      updateData.tenthMarkPercentage = tenthMarkPercentage;
    if (twelfthMarkPercentage !== undefined)
      updateData.twelfthMarkPercentage = twelfthMarkPercentage;
    if (ugMarkPercentage !== undefined)
      updateData.ugMarkPercentage = ugMarkPercentage;

    const updatedStudent = await StudentModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
      },
    );

    if (!updatedStudent) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Student not found" });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error updating student", error });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await StudentModel.findByIdAndUpdate(
      id,
      { isDelete: true },
      { new: true },
    );

    if (!student) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Student not found" });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error deleting student", error });
  }
};

// Get Student Dashboard Data
export const getStudentDashboardData = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student details
    const student = await StudentModel.findById(studentId);

    if (!student || student.isDelete) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Student not found" });
    }

    // Calculate attendance percentage
    const totalAttendance = await AttendanceModel.countDocuments({
      studentId: studentId,
      isDelete: false,
    });

    const presentCount = await AttendanceModel.countDocuments({
      studentId: studentId,
      status: "present",
      isDelete: false,
    });

    const attendancePercentage =
      totalAttendance > 0
        ? Math.round((presentCount / totalAttendance) * 100)
        : 0;

    // Get enrolled subjects count
    const enrolledSubjects = await StudentAssignmentSubmissionModel.distinct(
      "subject",
      {
        studentId: studentId,
        isDelete: false,
      },
    );

    const coursesCount = enrolledSubjects.length;

    // Get pending assignments count
    const pendingAssignments = await AssignmentModel.countDocuments({
      department: student.department,
      yearOfStudy: student.yearOfStudy,
      isDelete: false,
      dueDate: { $gte: new Date() },
    });

    // Get notifications (you can customize this logic)
    const notificationsCount = 5; // Default, can be fetched from a Notifications model if created

    const dashboardData = {
      studentId: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      rollNumber: student.rollNumber,
      department: student.department,
      yearOfStudy: student.yearOfStudy,
      attendance: attendancePercentage,
      courses: coursesCount,
      assignments: pendingAssignments,
      notifications: notificationsCount,
      email: student.email,
      phoneNumber: student.phoneNumber,
    };

    res.status(statusCodes.SUCCESS).json({
      message: "Dashboard data retrieved successfully",
      data: dashboardData,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error retrieving dashboard data", error });
  }
};

// Get Student Profile Details
export const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await StudentModel.findById(studentId);

    if (!student || student.isDelete) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Student not found" });
    }

    const profileData = {
      // Personal details
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      email: student.email,
      phoneNumber: student.phoneNumber,
      address: student.address,

      // Family details
      fatherName: student.fatherName,
      fatherPhone: student.fatherPhone,
      fatherOccupation: student.fatherOccupation,
      motherName: student.motherName,
      motherPhone: student.motherPhone,
      motherOccupation: student.motherOccupation,

      // Education details
      tenthMarkPercentage: student.tenthMarkPercentage,
      twelfthMarkPercentage: student.twelfthMarkPercentage,
      ugMarkPercentage: student.ugMarkPercentage,

      // Academic info
      rollNumber: student.rollNumber,
      department: student.department,
      yearOfStudy: student.yearOfStudy,
    };

    res.status(statusCodes.SUCCESS).json({
      message: "Student profile retrieved successfully",
      profile: profileData,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error retrieving student profile", error });
  }
};

// Update Student Profile Details
export const updateStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      phoneNumber,
      address,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
      tenthMarkPercentage,
      twelfthMarkPercentage,
      ugMarkPercentage,
    } = req.body;

    const updateData = cleanProfileUpdate({
      firstName,
      lastName,
      dateOfBirth,
      email,
      phoneNumber,
      address,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
      tenthMarkPercentage,
      twelfthMarkPercentage,
      ugMarkPercentage,
    });

    const updatedStudent = await StudentModel.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true },
    );

    if (!updatedStudent) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Student not found" });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Student profile updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error updating student profile", error });
  }
};

// Get Student by UserId (for logged-in student)
export const getStudentByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const student = await StudentModel.findOne({
      userId: userId,
      isDelete: false,
    });

    if (!student) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Student record not found" });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Student retrieved successfully",
      student: student,
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error retrieving student", error });
  }
};

// Get Student Attendance Details
export const getStudentAttendanceDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    const student = await StudentModel.findById(studentId);

    if (!student || student.isDelete) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Student not found" });
    }

    // Build filter
    const filter = {
      studentId: studentId,
      isDelete: false,
    };

    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Get attendance records
    const attendanceRecords = await AttendanceModel.find(filter)
      .populate("staffId", "firstName lastName")
      .sort({ date: -1 });

    // Calculate statistics
    const totalCount = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (r) => r.status === "present",
    ).length;
    const absentCount = attendanceRecords.filter(
      (r) => r.status === "absent",
    ).length;
    const leaveCount = attendanceRecords.filter(
      (r) => r.status === "leave",
    ).length;

    const attendancePercentage =
      totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(2) : 0;

    res.status(statusCodes.SUCCESS).json({
      message: "Attendance details retrieved successfully",
      attendance: {
        records: attendanceRecords,
        statistics: {
          total: totalCount,
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          attendancePercentage: parseFloat(attendancePercentage),
        },
      },
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error retrieving attendance details", error });
  }
};

// Get Student Profile by UserId (for logged-in students)
export const getStudentProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    let student = await StudentModel.findOne({
      userId: userId,
      isDelete: false,
    });

    if (!student) {
      student = await StudentModel.findOne({
        _id: userId,
        isDelete: false,
      });
    }

    if (!student) {
      const user = await UserModel.findOne({
        _id: userId,
        isDelete: false,
      });

      if (!user) {
        return res.status(statusCodes.SUCCESS).json({
          message: "Student profile not found",
          profile: {
            studentId: null,
            firstName: "",
            lastName: "",
            dateOfBirth: null,
            email: "",
            phoneNumber: "",
            address: "",
            fatherName: "",
            fatherPhone: "",
            fatherOccupation: "",
            motherName: "",
            motherPhone: "",
            motherOccupation: "",
            tenthMarkPercentage: 0,
            twelfthMarkPercentage: 0,
            ugMarkPercentage: 0,
            rollNumber: "",
            department: "",
            yearOfStudy: "",
          },
        });
      }

      return res.status(statusCodes.SUCCESS).json({
        message: "Student profile retrieved successfully",
        profile: buildUserBackedProfile(user),
      });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Student profile retrieved successfully",
      profile: buildStudentProfile(student),
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error retrieving student profile", error });
  }
};

// Update Student Profile by UserId (for logged-in students)
export const updateStudentProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      phoneNumber,
      address,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
      tenthMarkPercentage,
      twelfthMarkPercentage,
      ugMarkPercentage,
    } = req.body;

    let student = await StudentModel.findOne({
      userId: userId,
      isDelete: false,
    });

    if (!student) {
      student = await StudentModel.findOne({
        _id: userId,
        isDelete: false,
      });
    }

    if (!student) {
      const user = await UserModel.findOne({
        _id: userId,
        isDelete: false,
      });

      if (!user) {
        return res
          .status(statusCodes.NOT_FOUND)
          .json({ message: "Student profile not found" });
      }

      const nameParts = splitName(user.name);

      student = await StudentModel.findOne({
        rollNumber: user.rollNumber,
        isDelete: false,
      });

      if (student) {
        student.userId = userId;
        await student.save();
      } else {
        student = await StudentModel.create({
          userId,
          firstName: firstName ?? nameParts.firstName,
          lastName: lastName ?? nameParts.lastName,
          dateOfBirth: dateOfBirth || null,
          email: email ?? user.email,
          phoneNumber: phoneNumber ?? "",
          address: address ?? "",
          fatherName: fatherName ?? "",
          fatherPhone: fatherPhone ?? "",
          fatherOccupation: fatherOccupation ?? "",
          motherName: motherName ?? "",
          motherPhone: motherPhone ?? "",
          motherOccupation: motherOccupation ?? "",
          tenthMarkPercentage: tenthMarkPercentage ?? 0,
          twelfthMarkPercentage: twelfthMarkPercentage ?? 0,
          ugMarkPercentage: ugMarkPercentage ?? 0,
          rollNumber: user.rollNumber,
          department: user.department,
          yearOfStudy: user.yearOfStudy,
        });
      }
    }

    const updateData = cleanProfileUpdate({
      firstName,
      lastName,
      dateOfBirth,
      email,
      phoneNumber,
      address,
      fatherName,
      fatherPhone,
      fatherOccupation,
      motherName,
      motherPhone,
      motherOccupation,
      tenthMarkPercentage,
      twelfthMarkPercentage,
      ugMarkPercentage,
    });

    const updatedStudent = await StudentModel.findByIdAndUpdate(
      student._id,
      updateData,
      { new: true },
    );

    res.status(statusCodes.SUCCESS).json({
      message: "Student profile updated successfully",
      profile: buildStudentProfile(updatedStudent),
    });
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error updating student profile", error });
  }
};
