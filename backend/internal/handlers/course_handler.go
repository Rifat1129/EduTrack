package handlers

import (
	"math/rand"
	"net/http"
	"time"

	"edutrack/internal/config"
	"edutrack/internal/models"

	"github.com/gin-gonic/gin"
)

type CreateCourseInput struct {
	Title string `json:"title" binding:"required"`
	Code  string `json:"code" binding:"required"`
}

func CreateCourse(c *gin.Context) {
	var input CreateCourseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	teacherID := c.GetUint("user_id")

	// Generate random join code
	joinCode := generateJoinCode()

	course := models.Course{
		Code:      input.Code,
		Title:     input.Title,
		TeacherID: teacherID,
		JoinCode:  joinCode,
		IsActive:  true,
	}

	if err := config.DB.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course"})
		return
	}

	c.JSON(http.StatusCreated, course)
}

func generateJoinCode() string {
	const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func JoinCourse(c *gin.Context) {
	type JoinInput struct {
		JoinCode string `json:"join_code" binding:"required"`
	}

	var input JoinInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var course models.Course
	if err := config.DB.Where("join_code = ?", input.JoinCode).First(&course).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid join code"})
		return
	}

	studentID := c.GetUint("user_id")

	// Check if already enrolled
	var existing models.Enrollment
	if err := config.DB.Where("course_id = ? AND student_id = ?", course.ID, studentID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Already enrolled in this course"})
		return
	}

	enrollment := models.Enrollment{
		CourseID:   course.ID,
		StudentID:  studentID,
		Status:     "enrolled",
		EnrolledAt: time.Now(),
	}

	if err := config.DB.Create(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enroll"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully joined the course", "course": course})
}
