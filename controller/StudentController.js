import StudentModel from "../models/StudentModels.js";
import UserModel from "../models/UsersModels.js";
import AttendanceModel from "../models/AttendanceModel.js";
import AssignmentModel from "../models/AssignmentModel.js";
import StudentAssignmentSubmissionModel from "../models/StudentAssignmentSubmissionModel.js";
import StudentProfileUpdateRequestModel from "../models/StudentProfileUpdateRequestModel.js";
import NotificationModel from "../models/NotificationModel.js";
import { Messages } from "../utils/Messages.js";
import { statusCodes } from "../utils/StatusCodes.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const marksheetUploadDir = path.join(__dirname, "..", "uploads", "marksheets");

const sanitizeFileName = (fileName = "marksheet.pdf") =>
  String(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

const saveMarksheetPdf = async ({ studentId, fileDataUrl, fileName }) => {
  if (!fileDataUrl?.startsWith("data:application/pdf;base64,")) {
    return fileDataUrl;
  }

  await fs.mkdir(marksheetUploadDir, { recursive: true });

  const base64Content = fileDataUrl.split(",")[1];
  const fileBuffer = Buffer.from(base64Content, "base64");
  const safeOriginalName = sanitizeFileName(fileName);
  const storedFileName = `${studentId}-${Date.now()}-${safeOriginalName}`;
  const filePath = path.join(marksheetUploadDir, storedFileName);

  await fs.writeFile(filePath, fileBuffer);

  return `/uploads/marksheets/${storedFileName}`;
};

const saveMarksheetPdfs = async (profileData, studentId) => {
  const updateData = { ...profileData };
  const marksheetFields = [
    {
      urlField: "tenthMarksheetUrl",
      fileNameField: "tenthMarksheetFileName",
      fallbackName: "10th-marksheet.pdf",
    },
    {
      urlField: "twelfthMarksheetUrl",
      fileNameField: "twelfthMarksheetFileName",
      fallbackName: "12th-marksheet.pdf",
    },
    {
      urlField: "ugMarksheetUrl",
      fileNameField: "ugMarksheetFileName",
      fallbackName: "ug-marksheet.pdf",
    },
  ];

  for (const field of marksheetFields) {
    if (updateData[field.urlField]) {
      updateData[field.urlField] = await saveMarksheetPdf({
        studentId,
        fileDataUrl: updateData[field.urlField],
        fileName: updateData[field.fileNameField] || field.fallbackName,
      });
    }

    delete updateData[field.fileNameField];
  }

  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key],
  );

  return updateData;
};

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
  tenthMarksheetUrl: student.tenthMarksheetUrl,
  twelfthMarkPercentage: student.twelfthMarkPercentage,
  twelfthMarksheetUrl: student.twelfthMarksheetUrl,
  ugMarkPercentage: student.ugMarkPercentage,
  ugMarksheetUrl: student.ugMarksheetUrl,
  internalOneMark: student.internalOneMark,
  internalTwoMark: student.internalTwoMark,
  internalThreeMark: student.internalThreeMark,
  semesterMark: student.semesterMark,
  academicMarks: student.academicMarks || [],
  rollNumber: student.rollNumber,
  department: student.department,
  yearOfStudy: student.yearOfStudy,
  semester: student.semester,
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
    tenthMarksheetUrl: "",
    twelfthMarkPercentage: 0,
    twelfthMarksheetUrl: "",
    ugMarkPercentage: 0,
    ugMarksheetUrl: "",
    internalOneMark: null,
    internalTwoMark: null,
    internalThreeMark: null,
    semesterMark: null,
    academicMarks: [],
    rollNumber: user.rollNumber || "",
    department: user.department || "",
    yearOfStudy: user.yearOfStudy || "",
    semester: "",
  };
};

const getLatestProfileUpdateRequest = async ({ studentId, userId }) => {
  const filter = { isDelete: false };

  if (studentId) {
    filter.studentId = studentId;
  } else if (userId) {
    filter.userId = userId;
  } else {
    return null;
  }

  return StudentProfileUpdateRequestModel.findOne(filter)
    .sort({ updatedAt: -1, createdAt: -1 })
    .select("status rejectionReason reviewedAt createdAt updatedAt");
};

const cleanProfileUpdate = (profileData) => {
  const updateData = { ...profileData };

  if (updateData.dateOfBirth === "") {
    updateData.dateOfBirth = null;
  }

  [
    "tenthMarkPercentage",
    "twelfthMarkPercentage",
    "ugMarkPercentage",
    "internalOneMark",
    "internalTwoMark",
    "internalThreeMark",
    "semesterMark",
  ].forEach((field) => {
    if (updateData[field] === "") {
      updateData[field] = field.includes("Percentage") ? 0 : null;
    }
  });

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
      tenthMarksheetUrl,
      tenthMarksheetFileName,
      twelfthMarkPercentage,
      twelfthMarksheetUrl,
      twelfthMarksheetFileName,
      ugMarkPercentage,
      ugMarksheetUrl,
      ugMarksheetFileName,
      semester,
    } = req.body;

    const marksheetData = await saveMarksheetPdfs(
      {
        tenthMarksheetUrl,
        tenthMarksheetFileName,
        twelfthMarksheetUrl,
        twelfthMarksheetFileName,
        ugMarksheetUrl,
        ugMarksheetFileName,
      },
      userId || rollNumber,
    );

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
      tenthMarksheetUrl: marksheetData.tenthMarksheetUrl || "",
      twelfthMarkPercentage: twelfthMarkPercentage || 0,
      twelfthMarksheetUrl: marksheetData.twelfthMarksheetUrl || "",
      ugMarkPercentage: ugMarkPercentage || 0,
      ugMarksheetUrl: marksheetData.ugMarksheetUrl || "",
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
      semester,
      address,
      tenthMarkPercentage,
      tenthMarksheetUrl,
      tenthMarksheetFileName,
      twelfthMarkPercentage,
      twelfthMarksheetUrl,
      twelfthMarksheetFileName,
      ugMarkPercentage,
      ugMarksheetUrl,
      ugMarksheetFileName,
      internalOneMark,
      internalTwoMark,
      internalThreeMark,
      semesterMark,
      subject,
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
    if (semester) updateData.semester = semester;
    if (address) updateData.address = address;
    if (tenthMarkPercentage !== undefined)
      updateData.tenthMarkPercentage = tenthMarkPercentage;
    if (twelfthMarkPercentage !== undefined)
      updateData.twelfthMarkPercentage = twelfthMarkPercentage;
    if (ugMarkPercentage !== undefined)
      updateData.ugMarkPercentage = ugMarkPercentage;
    const hasAcademicMarks = [
      internalOneMark,
      internalTwoMark,
      internalThreeMark,
      semesterMark,
    ].some((mark) => mark !== undefined);

    if (internalOneMark !== undefined)
      updateData.internalOneMark = internalOneMark;
    if (internalTwoMark !== undefined)
      updateData.internalTwoMark = internalTwoMark;
    if (internalThreeMark !== undefined)
      updateData.internalThreeMark = internalThreeMark;
    if (semesterMark !== undefined) updateData.semesterMark = semesterMark;

    if (
      [internalOneMark, internalTwoMark, internalThreeMark].some(
        (mark) =>
          mark !== undefined &&
          mark !== null &&
          (Number(mark) < 0 || Number(mark) > 50),
      )
    ) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Internal marks must be between 0 and 50",
      });
    }

    if (
      semesterMark !== undefined &&
      semesterMark !== null &&
      (Number(semesterMark) < 0 || Number(semesterMark) > 100)
    ) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Semester mark must be between 0 and 100",
      });
    }

    Object.assign(
      updateData,
      await saveMarksheetPdfs(
        {
          tenthMarksheetUrl,
          tenthMarksheetFileName,
          twelfthMarksheetUrl,
          twelfthMarksheetFileName,
          ugMarksheetUrl,
          ugMarksheetFileName,
        },
        id,
      ),
    );

    if (hasAcademicMarks && subject && semester) {
      const student = await StudentModel.findById(id);

      if (!student) {
        return res
          .status(statusCodes.NOT_FOUND)
          .json({ message: "Student not found" });
      }

      const academicMarks = [...(student.academicMarks || [])];
      const existingMarkIndex = academicMarks.findIndex(
        (mark) => mark.subject === subject && mark.semester === semester,
      );
      const markEntry = {
        subject,
        semester,
        internalOneMark:
          internalOneMark !== undefined
            ? internalOneMark
            : academicMarks[existingMarkIndex]?.internalOneMark ?? null,
        internalTwoMark:
          internalTwoMark !== undefined
            ? internalTwoMark
            : academicMarks[existingMarkIndex]?.internalTwoMark ?? null,
        internalThreeMark:
          internalThreeMark !== undefined
            ? internalThreeMark
            : academicMarks[existingMarkIndex]?.internalThreeMark ?? null,
        semesterMark:
          semesterMark !== undefined
            ? semesterMark
            : academicMarks[existingMarkIndex]?.semesterMark ?? null,
      };

      updateData.academicMarks = [
        ...academicMarks.filter(
          (mark) => mark.subject !== subject || mark.semester !== semester,
        ),
        markEntry,
      ];
    }

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
      tenthMarksheetUrl: student.tenthMarksheetUrl,
      twelfthMarkPercentage: student.twelfthMarkPercentage,
      twelfthMarksheetUrl: student.twelfthMarksheetUrl,
      ugMarkPercentage: student.ugMarkPercentage,
      ugMarksheetUrl: student.ugMarksheetUrl,
      internalOneMark: student.internalOneMark,
      internalTwoMark: student.internalTwoMark,
      internalThreeMark: student.internalThreeMark,
      semesterMark: student.semesterMark,
      academicMarks: student.academicMarks || [],

      // Academic info
      rollNumber: student.rollNumber,
      department: student.department,
      yearOfStudy: student.yearOfStudy,
      semester: student.semester,
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
      tenthMarksheetUrl,
      tenthMarksheetFileName,
      twelfthMarkPercentage,
      twelfthMarksheetUrl,
      twelfthMarksheetFileName,
      ugMarkPercentage,
      ugMarksheetUrl,
      ugMarksheetFileName,
      rollNumber,
      department,
      yearOfStudy,
      semester,
    } = req.body;

    const updateData = await saveMarksheetPdfs(
      cleanProfileUpdate({
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
        tenthMarksheetUrl,
        tenthMarksheetFileName,
        twelfthMarkPercentage,
        twelfthMarksheetUrl,
        twelfthMarksheetFileName,
        ugMarkPercentage,
        ugMarksheetUrl,
        ugMarksheetFileName,
      }),
      studentId,
    );

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
            tenthMarksheetUrl: "",
            twelfthMarkPercentage: 0,
            twelfthMarksheetUrl: "",
            ugMarkPercentage: 0,
            ugMarksheetUrl: "",
            internalOneMark: null,
            internalTwoMark: null,
            internalThreeMark: null,
            semesterMark: null,
            academicMarks: [],
            rollNumber: "",
            department: "",
            yearOfStudy: "",
            semester: "",
          },
        });
      }

      return res.status(statusCodes.SUCCESS).json({
        message: "Student profile retrieved successfully",
        profile: buildUserBackedProfile(user),
        profileUpdateRequest: await getLatestProfileUpdateRequest({ userId }),
      });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Student profile retrieved successfully",
      profile: buildStudentProfile(student),
      profileUpdateRequest: await getLatestProfileUpdateRequest({
        studentId: student._id,
      }),
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
      tenthMarksheetUrl,
      tenthMarksheetFileName,
      twelfthMarkPercentage,
      twelfthMarksheetUrl,
      twelfthMarksheetFileName,
      ugMarkPercentage,
      ugMarksheetUrl,
      ugMarksheetFileName,
      rollNumber,
      department,
      yearOfStudy,
      semester,
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

      const studentRollNumber = user.rollNumber || rollNumber;
      const studentDepartment = user.department || department;
      const studentYearOfStudy = user.yearOfStudy || yearOfStudy;

      if (!studentRollNumber || !studentDepartment || !studentYearOfStudy) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message:
            "Student account is missing roll number, department, or year of study",
        });
      }

      student = await StudentModel.findOne({
        rollNumber: studentRollNumber,
        isDelete: false,
      });

      if (student) {
        student.userId = userId;
        await student.save();
      } else {
        const accountNameParts = splitName(user.name);

        student = await StudentModel.create({
          userId,
          firstName: accountNameParts.firstName,
          lastName: accountNameParts.lastName,
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
          tenthMarksheetUrl: "",
          twelfthMarkPercentage: 0,
          twelfthMarksheetUrl: "",
          ugMarkPercentage: 0,
          ugMarksheetUrl: "",
          rollNumber: studentRollNumber,
          department: studentDepartment,
          yearOfStudy: studentYearOfStudy,
          semester: semester ?? "",
        });
      }
    }

    const updateData = await saveMarksheetPdfs(
      cleanProfileUpdate({
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
        tenthMarksheetUrl,
        tenthMarksheetFileName,
        twelfthMarkPercentage,
        twelfthMarksheetUrl,
        twelfthMarksheetFileName,
        ugMarkPercentage,
        ugMarksheetUrl,
        ugMarksheetFileName,
      }),
      student._id,
    );

    const profileRequest =
      await StudentProfileUpdateRequestModel.findOneAndUpdate(
        {
          studentId: student._id,
          status: "pending",
          isDelete: false,
        },
        {
          studentId: student._id,
          userId,
          requestedProfile: updateData,
          status: "pending",
          reviewedBy: null,
          reviewedAt: null,
          rejectionReason: "",
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

    res.status(statusCodes.SUCCESS).json({
      message: "Profile update request sent to admin for approval",
      request: profileRequest,
      profile: buildStudentProfile(student),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(statusCodes.CONFLICT).json({
        message: "Student profile already exists for this roll number",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json({
        message: "Error requesting student profile update",
        error: error.message,
      });
  }
};

export const getStudentProfileUpdateRequests = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const filter = { isDelete: false };

    if (status !== "all") {
      filter.status = status;
    }

    const requests = await StudentProfileUpdateRequestModel.find(filter)
      .populate("studentId", "firstName lastName rollNumber department yearOfStudy")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(statusCodes.SUCCESS).json({
      message: "Profile update requests retrieved successfully",
      requests,
      count: requests.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error retrieving profile update requests",
      error,
    });
  }
};

export const approveStudentProfileUpdateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminId } = req.body;

    if (!requestId) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: "Request ID is required" });
    }

    const profileRequest = await StudentProfileUpdateRequestModel.findOne({
      _id: requestId,
      status: "pending",
      isDelete: false,
    });

    if (!profileRequest) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Pending profile request not found" });
    }

    const updatedStudent = await StudentModel.findByIdAndUpdate(
      profileRequest.studentId,
      profileRequest.requestedProfile,
      { new: true },
    );

    profileRequest.status = "approved";
    profileRequest.reviewedBy = adminId || null;
    profileRequest.reviewedAt = new Date();
    await profileRequest.save();

    await NotificationModel.create({
      title: "Profile Update Approved",
      message: "Your profile update request has been approved by admin.",
      type: "general",
      targetRole: "student",
      studentId: profileRequest.studentId,
      userId: profileRequest.userId,
    });

    res.status(statusCodes.SUCCESS).json({
      message: "Student profile updated successfully",
      profile: buildStudentProfile(updatedStudent),
      request: profileRequest,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error approving profile update request",
      error,
    });
  }
};

export const rejectStudentProfileUpdateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminId, rejectionReason } = req.body;

    const profileRequest = await StudentProfileUpdateRequestModel.findOne({
      _id: requestId,
      status: "pending",
      isDelete: false,
    });

    if (!profileRequest) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: "Pending profile request not found" });
    }

    profileRequest.status = "rejected";
    profileRequest.reviewedBy = adminId || null;
    profileRequest.reviewedAt = new Date();
    profileRequest.rejectionReason = rejectionReason || "";
    await profileRequest.save();

    await NotificationModel.create({
      title: "Profile Update Rejected",
      message: rejectionReason
        ? `Your profile update request was rejected. Reason: ${rejectionReason}`
        : "Your profile update request was rejected by admin.",
      type: "general",
      targetRole: "student",
      studentId: profileRequest.studentId,
      userId: profileRequest.userId,
    });

    res.status(statusCodes.SUCCESS).json({
      message: "Profile update request rejected",
      request: profileRequest,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error rejecting profile update request",
      error,
    });
  }
};
