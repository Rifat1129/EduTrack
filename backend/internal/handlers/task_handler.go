package handlers

import (
	"net/http"
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

	var input CreateTaskInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	openAt, err := time.Parse("2006-01-02 15:04", input.OpenAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid open_at format. Use YYYY-MM-DD HH:MM"})
		return
	}
	dueAt, err := time.Parse("2006-01-02 15:04", input.DueAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due_at format. Use YYYY-MM-DD HH:MM"})
		return
	}

	task := models.Task{
		CourseID:    input.CourseID,
		SessionID:   input.SessionID,
		TeacherID:   teacherID,
		Title:       input.Title,
		Description: input.Description,
		TaskMode:    input.TaskMode,
		OpenAt:      openAt,
		DueAt:       dueAt,
		MaxPoints:   input.MaxPoints,
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
