import Subject from "../models/subjectModels.js";
import UserModel from "../models/UsersModels.js";

// Create a new subject
export const CreateSubject = async (req, res) => {
  try {
    const { name, createdBy } = req.body;
    const subject = new Subject({ subjectName: name, createdBy });
    await subject.save();
    res.status(201).json(subject);
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
    const { name } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      id,
      { subjectName: name },
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
