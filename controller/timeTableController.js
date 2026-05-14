import TimeTableModel from "../models/timeTableModel.js";
import UserModel from "../models/UsersModels.js";

const MAX_SUBJECTS_PER_STAFF = 2;
const PERIODS_PER_DAY = 7;

export const getTimeTable = async (req, res) => {
  try {
    const result = await TimeTableModel.aggregate([
      {
        $unwind: "$weekDays",
      },
      {
        $unwind: "$weekDays.periods",
      },
      {
        $lookup: {
          from: "subjects",
          let: { subjectId: "$weekDays.periods.subject" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", { $toObjectId: "$$subjectId" }],
                },
              },
            },
          ],
          as: "subjectInfo",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { staffId: "$weekDays.periods.staff" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", { $toObjectId: "$$staffId" }],
                },
              },
            },
          ],
          as: "staffInfo",
        },
      },
      {
        $addFields: {
          "weekDays.periods.subjectName": {
            $ifNull: [
              { $arrayElemAt: ["$subjectInfo.subjectName", 0] },
              "Free",
            ],
          },
          "weekDays.periods.staffName": {
            $ifNull: [{ $arrayElemAt: ["$staffInfo.name", 0] }, "TBD"],
          },
        },
      },
      {
        $group: {
          _id: {
            timetableId: "$_id",
            day: "$weekDays.day",
          },
          timetableId: { $first: "$_id" },
          department: { $first: "$department" },
          yearOfStudy: { $first: "$yearOfStudy" },
          semester: { $first: "$semester" },
          duration: { $first: "$duration" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          periods: {
            $push: {
              subject: "$weekDays.periods.subject",
              staff: "$weekDays.periods.staff",
              subjectName: "$weekDays.periods.subjectName",
              staffName: "$weekDays.periods.staffName",
              startTime: "$weekDays.periods.startTime",
              endTime: "$weekDays.periods.endTime",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.timetableId",
          department: { $first: "$department" },
          yearOfStudy: { $first: "$yearOfStudy" },
          semester: { $first: "$semester" },
          duration: { $first: "$duration" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          weekDays: {
            $push: {
              day: "$_id.day",
              periods: "$periods",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          department: 1,
          yearOfStudy: 1,
          semester: 1,
          duration: 1,
          createdAt: 1,
          updatedAt: 1,
          weekDays: 1,
        },
      },
    ]);
    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const createTimeTable = async (req, res) => {
  try {
    const { weekDays, yearOfStudy, semester } = req.body;

    // Validate 5 days
    if (weekDays.length !== 5) {
      return res.status(400).json({
        message: "Timetable must contain 5 days (Mon-Fri)",
      });
    }

    // Validate 7 periods per day
    for (let day of weekDays) {
      if (day.periods.length !== PERIODS_PER_DAY) {
        return res.status(400).json({
          message: `${day.day} must have ${PERIODS_PER_DAY} periods`,
        });
      }
    }

    const subjectsByStaff = new Map();
    weekDays.forEach((day) => {
      day.periods.forEach((period) => {
        if (!period.staff || !period.subject) return;

        if (!subjectsByStaff.has(period.staff)) {
          subjectsByStaff.set(period.staff, new Set());
        }

        subjectsByStaff.get(period.staff).add(period.subject);
      });
    });

    const staffMembers = await UserModel.find({
      _id: { $in: [...subjectsByStaff.keys()] },
      role: { $in: ["staff", "coordinator"] },
      isDelete: false,
    }).select("name assignedSubjects");
    const staffById = new Map(
      staffMembers.map((staff) => [staff._id.toString(), staff]),
    );

    for (const [staffId, subjectIds] of subjectsByStaff.entries()) {
      const staff = staffById.get(staffId);

      if (!staff) {
        return res.status(400).json({
          message: "Selected staff member is not available",
        });
      }

      staff.assignedSubjects.forEach((assignedSubject) => {
        if (
          assignedSubject &&
          assignedSubject.yearOfStudy === yearOfStudy &&
          assignedSubject.semester === semester &&
          assignedSubject.subject
        ) {
          subjectIds.add(assignedSubject.subject.toString());
        }
      });

      if (subjectIds.size > MAX_SUBJECTS_PER_STAFF) {
        return res.status(400).json({
          message:
            "A staff member can handle a maximum of 2 subjects per year and semester",
        });
      }
    }

    const newTimeTable = new TimeTableModel(req.body);
    const result = await newTimeTable.save();

    res.status(201).json({
      message: "TimeTable created successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const updateTimeTable = async (req, res) => {
  // Logic to update an existing timetable entry in the database
};

export const deleteTimeTable = async (req, res) => {
  // Logic to delete a timetable entry from the database
};
