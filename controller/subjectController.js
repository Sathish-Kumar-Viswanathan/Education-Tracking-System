import Subject from "../models/subjectModels.js";

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
    const subjects = await Subject.find();
    res.status(200).json(subjects);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
