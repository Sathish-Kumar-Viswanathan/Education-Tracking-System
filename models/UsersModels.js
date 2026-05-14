import mongoose from "mongoose";

const schema = mongoose.Schema;

const assignedSubjectSchema = new schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
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
  },
  { _id: false },
);

const UsersSchema = new schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "student", "staff", "coordinator"],
    },
    rollNumber: {
      type: String,
      sparse: true,
      unique: true,
    },
    yearOfStudy: {
      type: String,
      default: null,
    },
    department: {
      type: String,
      default: null,
    },
    coordinatorYear: {
      type: String,
      default: null,
      enum: [null, "1", "2"],
    },
    assignedSubjects: {
      type: [assignedSubjectSchema],
      validate: {
        validator: (subjects) => {
          if (!subjects) return true;

          const countsByYearSemester = subjects
            .filter(Boolean)
            .reduce((counts, assignment) => {
              const key = `${assignment.yearOfStudy}-${assignment.semester}`;
              counts[key] = (counts[key] || 0) + 1;
              return counts;
            }, {});

          return Object.values(countsByYearSemester).every(
            (count) => count <= 2,
          );
        },
        message:
          "A staff member can handle a maximum of 2 subjects per year and semester",
      },
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const UserModel = mongoose.model("Users", UsersSchema);
export default UserModel;
