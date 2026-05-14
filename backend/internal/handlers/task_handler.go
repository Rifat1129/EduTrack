package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"edutrack/internal/config"
	"edutrack/internal/models"

	"github.com/gin-gonic/gin"
)

type CreateTaskInput struct {
	CourseID    uint   `json:"course_id" binding:"required"`
	SessionID   *uint  `json:"session_id"` // optional
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	TaskMode    string `json:"task_mode" binding:"required,oneof=scan_only file_required"`
	OpenAt      string `json:"open_at" binding:"required"` // "2026-05-02 10:00"
	DueAt       string `json:"due_at" binding:"required"`
	MaxPoints   int    `json:"max_points"`
}

func CreateTask(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	courseID := c.PostForm("course_id")
	title := c.PostForm("title")
	description := c.PostForm("description")
	taskMode := c.PostForm("task_mode")
	openAtStr := c.PostForm("open_at")
	dueAtStr := c.PostForm("due_at")
	maxPointsStr := c.PostForm("max_points")

	if courseID == "" || title == "" || taskMode == "" || openAtStr == "" || dueAtStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	loc, _ := time.LoadLocation("Asia/Dhaka")
	openAt, err := time.ParseInLocation("2006-01-02 15:04", openAtStr, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid open_at format"})
		return
	}
	dueAt, err := time.ParseInLocation("2006-01-02 15:04", dueAtStr, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due_at format"})
		return
	}

	maxPoints := 25
	if maxPointsStr != "" {
		fmt.Sscanf(maxPointsStr, "%d", &maxPoints)
	}

	cID := 0
	fmt.Sscanf(courseID, "%d", &cID)

	// Handle optional file upload
	var fileURL *string
	file, err := c.FormFile("file")
	if err == nil && file != nil {
		_ = os.MkdirAll("uploads", 0755)
		filename := fmt.Sprintf("task_teacher_%d_%d%s", teacherID, time.Now().Unix(), filepath.Ext(file.Filename))
		savePath := filepath.Join("uploads", filename)
		if err := c.SaveUploadedFile(file, savePath); err == nil {
			url := "/uploads/" + filename
			fileURL = &url
		}
	}

	task := models.Task{
		CourseID:    uint(cID),
		TeacherID:   teacherID,
		Title:       title,
		Description: description,
		TaskMode:    taskMode,
		FileURL:     fileURL,
		OpenAt:      openAt,
		DueAt:       dueAt,
		MaxPoints:   maxPoints,
	}

	if err := config.DB.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	c.JSON(http.StatusCreated, task)
}

func ListMyTasks(c *gin.Context) {
	studentID := c.GetUint("user_id")
	courseID := c.Query("course_id")

	type Row struct {
		ID          uint      `json:"id"`
		CourseID    uint      `json:"course_id"`
		SessionID   *uint     `json:"session_id"`
		Title       string    `json:"title"`
		Description string    `json:"description"`
		TaskMode    string    `json:"task_mode"`
		OpenAt      time.Time `json:"open_at"`
		DueAt       time.Time `json:"due_at"`
		MaxPoints   int       `json:"max_points"`
		Submitted   bool      `json:"submitted"`
	}

	// Only tasks for courses where student enrolled
	// Simplify: filter by course_id passed (required)
	if courseID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course_id query param required"})
		return
	}

	var rows []Row
	query := `
		SELECT 
			t.id, t.course_id, t.session_id, t.title, t.description, t.task_mode, t.open_at, t.due_at, t.max_points,
			CASE WHEN s.id IS NULL THEN FALSE ELSE TRUE END AS submitted
		FROM tasks t
		JOIN enrollments e ON e.course_id = t.course_id AND e.student_id = ?
		LEFT JOIN submissions s ON s.task_id = t.id AND s.student_id = ?
		WHERE t.course_id = ?
		ORDER BY t.due_at ASC
	`
	config.DB.Raw(query, studentID, studentID, courseID).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}
