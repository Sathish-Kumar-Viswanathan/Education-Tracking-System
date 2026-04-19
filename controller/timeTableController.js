import TimeTableModel from "../models/timeTableModel.js";

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
    const { weekDays } = req.body;

    // Validate 5 days
    if (weekDays.length !== 5) {
      return res.status(400).json({
        message: "Timetable must contain 5 days (Mon-Fri)",
      });
    }

    // Validate 8 periods per day
    for (let day of weekDays) {
      if (day.periods.length !== 8) {
        return res.status(400).json({
          message: `${day.day} must have 8 periods`,
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
