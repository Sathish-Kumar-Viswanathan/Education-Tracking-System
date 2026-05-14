import Subject from "../models/subjectModels.js";
import UserModel from "../models/UsersModels.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Create a new subject
export const CreateSubject = async (req, res) => {
  try {
    const { name, createdBy, yearOfStudy, semester } = req.body;
    const subjectName = String(name || "").trim();

    if (!subjectName || !yearOfStudy || !semester) {
      return res.status(400).json({
        message: "Subject name, year, and semester are required",
      });
    }

    const existingSubject = await Subject.findOne({
      subjectName: new RegExp(`^${escapeRegex(subjectName)}$`, "i"),
    });

    if (existingSubject) {
      existingSubject.yearOfStudy = yearOfStudy;
      existingSubject.semester = semester;
      existingSubject.isDelete = false;
      await existingSubject.save();

      return res.status(200).json({
        message: "Subject already exists. Year and semester updated.",
        subject: existingSubject,
        updated: true,
      });
    }

    const subject = new Subject({
      subjectName,
      yearOfStudy,
      semester,
      createdBy,
    });
    await subject.save();
    res.status(201).json({
      message: "Subject created successfully",
      subject,
      updated: false,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get all subjects
export const GetAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.aggregate([
      // Removed $match to include all subjects (active and inactive)
      {
        $lookup: {
          from: "users", // Collection name for User model
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $unwind: {
          path: "$creator",
          preserveNullAndEmptyArrays: true, // In case creator is deleted
        },
      },
      {
        $project: {
          _id: 1,
          subjectName: 1,
          yearOfStudy: 1,
          semester: 1,
          createdBy: 1,
          isDelete: 1, // Include isDelete field
          createdAt: 1,
          updatedAt: 1,
          creatorName: "$creator.name",
          creatorEmail: "$creator.email",
        },
      },
    ]);
    res.status(200).json(subjects);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete subject (soft delete)
export const DeleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndUpdate(
      id,
      { isDelete: true },
      { new: true },
    );
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Restore subject
export const RestoreSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndUpdate(
      id,
      { isDelete: false },
      { new: true },
    );
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.status(200).json({ message: "Subject restored successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Update subject
export const UpdateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, yearOfStudy, semester } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      id,
      { subjectName: name, yearOfStudy, semester },
      { new: true },
    );

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ message: "Subject updated successfully", subject });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
