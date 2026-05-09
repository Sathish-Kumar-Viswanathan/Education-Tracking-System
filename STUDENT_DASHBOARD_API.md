# Student Dashboard Backend API Documentation

## Overview

This document describes all the backend endpoints for the Student Dashboard functionality.

## Base URL

```
http://localhost:5000/api/students
```

## Endpoints

### 1. Get All Students

**GET** `/`

Retrieves a list of all students with optional filters.

**Query Parameters:**

- `department` (optional): Filter by department
- `yearOfStudy` (optional): Filter by year of study

**Response:**

```json
{
  "students": [
    {
      "_id": "student_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "1234567890",
      "rollNumber": "CS001",
      "department": "Computer Science",
      "yearOfStudy": "1st Year",
      "address": "123 Main St",
      ...
    }
  ],
  "count": 1
}
```

---

### 2. Create Student

**POST** `/create-student`

Creates a new student record.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2002-01-15",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "fatherName": "James Doe",
  "fatherPhone": "9876543210",
  "fatherOccupation": "Engineer",
  "motherName": "Jane Doe",
  "motherPhone": "9876543211",
  "motherOccupation": "Teacher",
  "rollNumber": "CS001",
  "department": "Computer Science",
  "yearOfStudy": "1st Year",
  "address": "123 Main St",
  "userId": "user_id",
  "tenthMarkPercentage": 85,
  "twelfthMarkPercentage": 90,
  "ugMarkPercentage": 0
}
```

**Response:**

```json
{
  "message": "Student created successfully",
  "student": {
    "_id": "student_id",
    "firstName": "John",
    ...
  }
}
```

---

### 3. Get Student by ID

**GET** `/:id`

Retrieves a specific student's details.

**Path Parameters:**

- `id` (required): Student ID

**Response:**

```json
{
  "student": {
    "_id": "student_id",
    "firstName": "John",
    "lastName": "Doe",
    ...
  }
}
```

---

### 4. Update Student

**PUT** `/:id`

Updates a student's basic information.

**Path Parameters:**

- `id` (required): Student ID

**Request Body:** (All fields optional)

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2002-01-15",
  "email": "john@example.com",
  ...
}
```

**Response:**

```json
{
  "message": "Student updated successfully",
  "student": { ... }
}
```

---

### 5. Delete Student

**DELETE** `/:id`

Soft deletes a student (marks as deleted).

**Path Parameters:**

- `id` (required): Student ID

**Response:**

```json
{
  "message": "Student deleted successfully"
}
```

---

### 6. Get Student Dashboard Data ⭐

**GET** `/:studentId/dashboard`

Retrieves all dashboard statistics for a student.

**Path Parameters:**

- `studentId` (required): Student ID

**Response:**

```json
{
  "message": "Dashboard data retrieved successfully",
  "data": {
    "studentId": "student_id",
    "firstName": "John",
    "lastName": "Doe",
    "rollNumber": "CS001",
    "department": "Computer Science",
    "yearOfStudy": "1st Year",
    "attendance": 85, // Attendance percentage
    "courses": 6, // Number of enrolled courses
    "assignments": 3, // Number of pending assignments
    "notifications": 5, // Number of new notifications
    "email": "john@example.com",
    "phoneNumber": "1234567890"
  }
}
```

---

### 7. Get Student Profile

**GET** `/:studentId/profile`

Retrieves complete profile details of a student (personal, family, education).

**Path Parameters:**

- `studentId` (required): Student ID

**Response:**

```json
{
  "message": "Student profile retrieved successfully",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "2002-01-15",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "address": "123 Main St",
    "fatherName": "James Doe",
    "fatherPhone": "9876543210",
    "fatherOccupation": "Engineer",
    "motherName": "Jane Doe",
    "motherPhone": "9876543211",
    "motherOccupation": "Teacher",
    "tenthMarkPercentage": 85,
    "twelfthMarkPercentage": 90,
    "ugMarkPercentage": 0,
    "rollNumber": "CS001",
    "department": "Computer Science",
    "yearOfStudy": "1st Year"
  }
}
```

---

### 8. Update Student Profile

**PUT** `/:studentId/profile`

Updates all profile details of a student.

**Path Parameters:**

- `studentId` (required): Student ID

**Request Body:** (All fields optional)

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2002-01-15",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "address": "123 Main St",
  "fatherName": "James Doe",
  "fatherPhone": "9876543210",
  "fatherOccupation": "Engineer",
  "motherName": "Jane Doe",
  "motherPhone": "9876543211",
  "motherOccupation": "Teacher",
  "tenthMarkPercentage": 85,
  "twelfthMarkPercentage": 90,
  "ugMarkPercentage": 0
}
```

**Response:**

```json
{
  "message": "Student profile updated successfully",
  "student": { ... }
}
```

---

## Frontend Usage

### Import the service

```javascript
import {
  getStudentDashboardData,
  getStudentProfile,
  updateStudentProfile,
  getStudentById,
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/services/students/students.axios";
```

### Example: Fetch Dashboard Data

```javascript
const data = await getStudentDashboardData(studentId);
console.log(data.data); // Access dashboard stats
```

### Example: Get and Update Profile

```javascript
const profile = await getStudentProfile(studentId);
const updatedProfile = await updateStudentProfile(studentId, {
  firstName: "Jane",
  email: "jane@example.com",
});
```

---

## Error Responses

All endpoints return error responses with appropriate HTTP status codes:

- **400**: Bad Request
- **404**: Not Found
- **500**: Internal Server Error

**Error Response Format:**

```json
{
  "message": "Error message description",
  "error": {
    /* error details */
  }
}
```

---

## Database Models

### Student Model

```javascript
{
  userId: ObjectId,
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  email: String,
  phoneNumber: String,
  fatherName: String,
  fatherPhone: String,
  fatherOccupation: String,
  motherName: String,
  motherPhone: String,
  motherOccupation: String,
  rollNumber: String (unique),
  department: String,
  yearOfStudy: String,
  address: String,
  tenthMarkPercentage: Number,
  twelfthMarkPercentage: Number,
  ugMarkPercentage: Number,
  isDelete: Boolean (default: false),
  userType: String (default: "Student"),
  timestamps: { createdAt, updatedAt }
}
```

---

## Related Collections

- **Attendance**: Tracks student attendance
- **Assignment**: Contains assignment details
- **StudentAssignmentSubmission**: Tracks assignment submissions

---

## Notes

- All dates should be in ISO format (YYYY-MM-DD)
- Roll numbers must be unique
- Soft delete is used (isDelete flag instead of hard delete)
- Dashboard data automatically calculates:
  - Attendance percentage from Attendance records
  - Courses count from distinct subjects in StudentAssignmentSubmission
  - Pending assignments from current and future due dates
