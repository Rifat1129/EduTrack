package handlers

import (
	"net/http"
	"time"

	"edutrack/internal/config"
	"edutrack/internal/models"

	"github.com/gin-gonic/gin"
)

type CreateSessionInput struct {
	CourseID  uint   `json:"course_id" binding:"required"`
	Room      string `json:"room" binding:"required"`
	StartTime string `json:"start_time" binding:"required"` // format: "2025-04-10 09:00"
	EndTime   string `json:"end_time" binding:"required"`   // format: "2025-04-10 11:00"
}

func CreateSession(c *gin.Context) {
	var input CreateSessionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	teacherID := c.GetUint("user_id")

	loc, _ := time.LoadLocation("Asia/Dhaka")
	startTime, err := time.ParseInLocation("2006-01-02 15:04", input.StartTime, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format. Use YYYY-MM-DD HH:MM"})
		return
	}

	endTime, err := time.ParseInLocation("2006-01-02 15:04", input.EndTime, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format. Use YYYY-MM-DD HH:MM"})
		return
	}

	session := models.ClassSession{
		CourseID:  input.CourseID,
		TeacherID: teacherID,
		Room:      input.Room,
		StartTime: startTime,
		EndTime:   endTime,
		Status:    "scheduled",
	}

	if err := config.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.JSON(http.StatusCreated, session)
}

func StartSession(c *gin.Context) {
	sessionID := c.Param("id")
	teacherID := c.GetUint("user_id")

	var session models.ClassSession
	if err := config.DB.Where("id = ? AND teacher_id = ?", sessionID, teacherID).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	session.Status = "live"
	config.DB.Save(&session)

	c.JSON(http.StatusOK, gin.H{"message": "Session started", "session": session})
}

func EndSession(c *gin.Context) {
	sessionID := c.Param("id")
	teacherID := c.GetUint("user_id")

	var session models.ClassSession
	if err := config.DB.Where("id = ? AND teacher_id = ?", sessionID, teacherID).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	session.Status = "ended"
	config.DB.Save(&session)

	c.JSON(http.StatusOK, gin.H{"message": "Session ended", "session": session})
}
