import TimeTableModel from "../models/timeTableModel.js";

export const getTimeTable = async (req, res) => {
  try {
    const result = await TimeTableModel.find(data);
    if (result.length > 0) {
      res.status(200).json({
        message: "TimeTable data retrieved successfully",
        data: result,
      });
    } else {
      return res.status(400).json({ message: "Bad Request: No data provided" });
    }
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
