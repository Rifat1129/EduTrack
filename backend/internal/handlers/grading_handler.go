package handlers

import (
	"net/http"
	"time"

	"edutrack/internal/config"
	"edutrack/internal/models"

	"github.com/gin-gonic/gin"
)

type PendingRow struct {
	SubmissionID uint    `json:"submission_id"`
	TaskID       uint    `json:"task_id"`
	TaskTitle    string  `json:"task_title"`
	TaskMode     string  `json:"task_mode"`
	StudentID    uint    `json:"student_id"`
	StudentName  string  `json:"student_name"`
	FileURL      *string `json:"file_url"`
	SubmittedAt  string  `json:"submitted_at"`
	Status       string  `json:"status"`
}

func GetPendingSubmissions(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	query := `
		SELECT 
			s.id as submission_id,
			t.id as task_id,
			t.title as task_title,
			t.task_mode as task_mode,
			s.student_id as student_id,
			u.full_name as student_name,
			s.file_url as file_url,
			DATE_FORMAT(s.submitted_at, '%Y-%m-%d %H:%i:%s') as submitted_at,
			s.status as status
		FROM submissions s
		JOIN tasks t ON t.id = s.task_id
		JOIN users u ON u.id = s.student_id
		LEFT JOIN grades g ON g.task_id = t.id AND g.student_id = s.student_id
		WHERE t.teacher_id = ? AND g.id IS NULL
		ORDER BY s.submitted_at ASC
	`
	var rows []PendingRow
	config.DB.Raw(query, teacherID).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}

type GiveGradeInput struct {
	TaskID     uint   `json:"task_id" binding:"required"`
	StudentID  uint   `json:"student_id" binding:"required"`
	Points     int    `json:"points" binding:"required"`
	GradeLabel string `json:"grade_label"`
	Feedback   string `json:"feedback"`
}

func GiveGrade(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	var input GiveGradeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// prevent duplicate grade
	var count int64
	config.DB.Table("grades").
		Where("task_id = ? AND student_id = ?", input.TaskID, input.StudentID).
		Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Already graded"})
		return
	}

	tx := config.DB.Begin()

	g := models.Grade{
		TaskID:     input.TaskID,
		StudentID:  input.StudentID,
		TeacherID:  teacherID,
		Points:     input.Points,
		GradeLabel: input.GradeLabel,
		Feedback:   input.Feedback,
	}

	if err := tx.Create(&g).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save grade", "db_error": err.Error()})
		return
	}

	ledger := models.PointsLedger{
		StudentID:  input.StudentID,
		SourceType: "manual_grade",
		SourceID:   g.ID,
		Points:     input.Points,
		CreatedAt:  time.Now(),
	}

	if err := tx.Create(&ledger).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add points ledger", "db_error": err.Error()})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Graded successfully", "grade": g})
}
