import AttendanceModel from "../models/AttendanceModel.js";
import StudentModel from "../models/StudentModels.js";
import UserModel from "../models/UsersModels.js";
import { statusCodes } from "../utils/StatusCodes.js";

const getAttendanceSummary = (records) => {
  const total = records.length;
  const present = records.filter((record) => record.status === "present").length;
  const absent = records.filter((record) => record.status === "absent").length;
  const leave = records.filter((record) => record.status === "leave").length;
  const attendancePercentage =
    total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;

  return {
    total,
    present,
    absent,
    leave,
    attendancePercentage,
  };
};

const getSubjectWiseAttendance = (records) => {
  const groupedRecords = records.reduce((groups, record) => {
    const subject = record.subject || "Unknown Subject";

    if (!groups[subject]) {
      groups[subject] = [];
    }

    groups[subject].push(record);
    return groups;
  }, {});

  return Object.entries(groupedRecords)
    .map(([subject, subjectRecords]) => ({
      subject,
      ...getAttendanceSummary(subjectRecords),
      periodWiseAttendance: getPeriodWiseAttendance(subjectRecords),
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
};

const getPeriodWiseAttendance = (records) => {
  const groupedRecords = records.reduce((groups, record) => {
    const period = record.period || "Not Set";

    if (!groups[period]) {
      groups[period] = [];
    }

    groups[period].push(record);
    return groups;
  }, {});

  return Object.entries(groupedRecords)
    .map(([period, periodRecords]) => {
      const latestRecord = periodRecords[0];

      return {
        period,
        status: latestRecord?.status || "absent",
        date: latestRecord?.date || null,
        ...getAttendanceSummary(periodRecords),
      };
    })
    .sort((a, b) => {
      const periodA = Number(a.period);
      const periodB = Number(b.period);

      if (Number.isNaN(periodA)) return 1;
      if (Number.isNaN(periodB)) return -1;
      return periodA - periodB;
    });
};

const addDateRangeFilter = (filter, query) => {
  const { date, month, year } = query;

  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    filter.date = { $gte: startDate, $lte: endDate };
    return;
  }

  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);
    endDate.setHours(23, 59, 59, 999);
    filter.date = { $gte: startDate, $lte: endDate };
  }
};

const getDayRange = (date) => {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

const normalizePeriod = (period) => Number(period);

const isValidPeriod = (period) =>
  Number.isInteger(normalizePeriod(period)) &&
  normalizePeriod(period) >= 1 &&
  normalizePeriod(period) <= 7;

const getStudentClass = async (studentId) => {
  const student = await StudentModel.findById(studentId);

  if (!student || student.isDelete) {
    return null;
  }

  return {
    department: student.department,
    yearOfStudy: student.yearOfStudy,
  };
};

const getClassStudentIds = async ({ department, yearOfStudy }) => {
  const students = await StudentModel.find({
    department,
    yearOfStudy,
    isDelete: false,
  }).select("_id");

  return students.map((student) => student._id);
};

const getClassPeriodAttendance = async ({ department, yearOfStudy, date, period }) => {
  const classStudentIds = await getClassStudentIds({ department, yearOfStudy });

  if (classStudentIds.length === 0) {
    return null;
  }

  const { startDate, endDate } = getDayRange(date);

  return AttendanceModel.findOne({
    studentId: { $in: classStudentIds },
    period: normalizePeriod(period),
    isDelete: false,
    date: { $gte: startDate, $lte: endDate },
  });
};

export const createAttendance = async (req, res) => {
  try {
    const { studentId, staffId, subject, date, period, status, remarks } =
      req.body;

    if (!studentId || !staffId || !subject || !date || !period) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Student ID, Staff ID, Subject, Date, and Period are required",
      });
    }

    if (!isValidPeriod(period)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Period must be between 1 and 7",
      });
    }

    const studentClass = await getStudentClass(studentId);

    if (!studentClass) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Student not found",
      });
    }

    const existingAttendance = await getClassPeriodAttendance({
      ...studentClass,
      date,
      period,
    });

    if (existingAttendance) {
      return res.status(statusCodes.CONFLICT).json({
        message: "Attendance already marked for this class, date, and period",
      });
    }

    const newAttendance = await AttendanceModel.create({
      studentId,
      staffId,
      subject,
      date,
      period: normalizePeriod(period),
      status: status || "present",
      remarks: remarks || "",
    });

    res.status(statusCodes.CREATED).json({
      message: "Attendance recorded successfully",
      attendance: newAttendance,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error creating attendance",
      error,
    });
  }
};

// Batch create attendance for multiple students
export const createBatchAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "attendanceRecords array is required and cannot be empty",
      });
    }

    // Validate each record
    for (const record of attendanceRecords) {
      if (
        !record.studentId ||
        !record.staffId ||
        !record.subject ||
        !record.date ||
        !record.period
      ) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message:
            "Each record must have studentId, staffId, subject, date, and period",
        });
      }

      if (!isValidPeriod(record.period)) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Period must be between 1 and 7",
        });
      }
    }

    const classChecks = new Map();

    for (const record of attendanceRecords) {
      const studentClass = await getStudentClass(record.studentId);

      if (!studentClass) {
        return res.status(statusCodes.NOT_FOUND).json({
          message: "One or more students were not found",
        });
      }

      const dateKey = new Date(record.date).toISOString().split("T")[0];
      const classKey = `${studentClass.department}|${studentClass.yearOfStudy}|${dateKey}|${normalizePeriod(record.period)}`;

      if (classChecks.has(classKey)) {
        classChecks.get(classKey).subjects.add(record.subject);
      } else {
        classChecks.set(classKey, {
          ...studentClass,
          date: record.date,
          period: record.period,
          subjects: new Set([record.subject]),
        });
      }
    }

    for (const classCheck of classChecks.values()) {
      if (classCheck.subjects.size > 1) {
        return res.status(statusCodes.CONFLICT).json({
          message:
            "Only one subject can be marked for the same class, date, and period",
        });
      }

      const existingAttendance = await getClassPeriodAttendance(classCheck);

      if (existingAttendance) {
        return res.status(statusCodes.CONFLICT).json({
          message:
            "Attendance already marked for this class, date, and period",
        });
      }
    }

    if (attendanceRecords.length === 0) {
      return res.status(statusCodes.CONFLICT).json({
        message: "No attendance records to create",
      });
    }

    // Insert all records
    const createdAttendance = await AttendanceModel.insertMany(
      attendanceRecords.map((record) => ({
        studentId: record.studentId,
        staffId: record.staffId,
        subject: record.subject,
        date: record.date,
        period: normalizePeriod(record.period),
        status: record.status || "present",
        remarks: record.remarks || "",
        isDelete: false,
      }))
    );

    res.status(statusCodes.CREATED).json({
      message: `Batch attendance created successfully for ${createdAttendance.length} students`,
      count: createdAttendance.length,
      attendance: createdAttendance,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error creating batch attendance",
      error,
    });
  }
};

export const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const filter = {
      studentId,
      isDelete: false,
    };

    addDateRangeFilter(filter, req.query);

    const attendance = await AttendanceModel.find(filter)
      .populate("studentId", "firstName lastName rollNumber")
      .populate("staffId", "name email")
      .sort({ date: -1 });

    res.status(statusCodes.SUCCESS).json({
      attendance,
      count: attendance.length,
      stats: getAttendanceSummary(attendance),
      subjectWiseAttendance: getSubjectWiseAttendance(attendance),
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching attendance",
      error,
    });
  }
};

export const getAttendanceByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { date, studentId, subject, period } = req.query;

    const filter = { staffId, isDelete: false };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (studentId) {
      filter.studentId = studentId;
    }

    if (subject) {
      filter.subject = subject;
    }

    if (period) {
      filter.period = normalizePeriod(period);
    }

    const attendance = await AttendanceModel.find(filter)
      .populate(
        "studentId",
        "firstName lastName rollNumber department yearOfStudy",
      )
      .populate("staffId", "name email")
      .sort({ date: -1 });

    res.status(statusCodes.SUCCESS).json({
      attendance,
      count: attendance.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching attendance",
      error,
    });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const updatedAttendance = await AttendanceModel.findByIdAndUpdate(
      id,
      { status, remarks },
      { new: true },
    );

    if (!updatedAttendance) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Attendance record not found",
      });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Attendance updated successfully",
      attendance: updatedAttendance,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error updating attendance",
      error,
    });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAttendance = await AttendanceModel.findByIdAndUpdate(
      id,
      { isDelete: true },
      { new: true },
    );

    if (!deletedAttendance) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Attendance record not found",
      });
    }

    res.status(statusCodes.SUCCESS).json({
      message: "Attendance deleted successfully",
      attendance: deletedAttendance,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error deleting attendance",
      error,
    });
  }
};

export const getStudentDashboardAttendance = async (req, res) => {
  try {
    const { userId } = req.params;

    let student = await StudentModel.findOne({
      userId,
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
        role: "student",
        isDelete: false,
      });

      if (user?.rollNumber) {
        student = await StudentModel.findOne({
          rollNumber: user.rollNumber,
          isDelete: false,
        });

        if (student && !student.userId) {
          student.userId = userId;
          await student.save();
        }
      }

      if (!student) {
        return res.status(statusCodes.SUCCESS).json({
          message: "Student attendance not found",
          student: null,
          stats: getAttendanceSummary([]),
          subjectWiseAttendance: [],
          recentAttendance: [],
          attendance: [],
          count: 0,
        });
      }
    }

    const filter = {
      studentId: student._id,
      isDelete: false,
    };

    addDateRangeFilter(filter, req.query);

    const attendance = await AttendanceModel.find(filter)
      .populate("staffId", "name email")
      .sort({ date: -1 });

    res.status(statusCodes.SUCCESS).json({
      message: "Student dashboard attendance retrieved successfully",
      student: {
        studentId: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        department: student.department,
        yearOfStudy: student.yearOfStudy,
      },
      stats: getAttendanceSummary(attendance),
      subjectWiseAttendance: getSubjectWiseAttendance(attendance),
      recentAttendance: attendance.slice(0, 10),
      attendance,
      count: attendance.length,
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching student dashboard attendance",
      error,
    });
  }
};

export const getAttendanceStats = async (req, res) => {
  try {
    const { studentId, staffId } = req.query;

    const filter = { isDelete: false };

    if (studentId) {
      filter.studentId = studentId;
    }
    if (staffId) {
      filter.staffId = staffId;
    }

    addDateRangeFilter(filter, req.query);

    const allRecords = await AttendanceModel.find(filter);

    res.status(statusCodes.SUCCESS).json({
      stats: getAttendanceSummary(allRecords),
    });
  } catch (error) {
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error calculating attendance stats",
      error,
    });
  }
};
