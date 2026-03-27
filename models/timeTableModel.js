import mongoose from "mongoose";

const Schema = mongoose.Schema;

// ⭐ Period Schema (1 hour)
const periodSchema = new Schema({
  subject: {
    type: String,
    required: true,
  },
  staff: {
    type: String,
    required: true,
  },
  startTime: String,
  endTime: String,
});

// ⭐ Day Schema (8 periods)
const daySchema = new Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    required: true,
  },
  periods: {
    type: [periodSchema],
    validate: [(val) => val.length === 8, "Each day must have 8 periods"],
  },
});

// ⭐ Main Timetable Schema
const TimeTableSchema = new Schema(
  {
    department: {
      type: String,
      required: true,
    },

    yearOfStudy: {
      type: String,
      required: true,
    },

    semester: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    weekDays: {
      type: [daySchema], // 🔥 UPDATED
      required: true,
    },
  },
  { timestamps: true },
);

const TimeTableModel = mongoose.model("TimeTable", TimeTableSchema);

export default TimeTableModel;
