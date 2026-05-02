package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

type MarkRow struct {
	TaskID     uint     `json:"task_id"`
	Title      string   `json:"title"`
	MyPoints   *int     `json:"my_points"`
	Highest    *int     `json:"highest"`
	Lowest     *int     `json:"lowest"`
	Average    *float64 `json:"average"`
	GradeLabel *string  `json:"grade_label"`
	Feedback   *string  `json:"feedback"`
}

func GetMyMarks(c *gin.Context) {
	studentID := c.GetUint("user_id")
	courseID := c.Query("course_id")
	if courseID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course_id required"})
		return
	}

	query := `
		SELECT
			t.id as task_id,
			t.title as title,
			g.points as my_points,
			g.grade_label as grade_label,
			g.feedback as feedback,
			(SELECT MAX(points) FROM grades WHERE task_id = t.id) as highest,
			(SELECT MIN(points) FROM grades WHERE task_id = t.id) as lowest,
			(SELECT AVG(points) FROM grades WHERE task_id = t.id) as average
		FROM tasks t
		LEFT JOIN grades g ON g.task_id = t.id AND g.student_id = ?
		WHERE t.course_id = ?
		ORDER BY t.due_at DESC
	`

	var rows []MarkRow
	config.DB.Raw(query, studentID, courseID).Scan(&rows)
	c.JSON(http.StatusOK, rows)
}

type PendingTaskRow struct {
	TaskID    uint   `json:"task_id"`
	Title     string `json:"title"`
	TaskMode  string `json:"task_mode"`
	DueAt     string `json:"due_at"`
	Submitted bool   `json:"submitted"`
	Graded    bool   `json:"graded"`
}

func GetMyPending(c *gin.Context) {
	studentID := c.GetUint("user_id")
	courseID := c.Query("course_id")
	if courseID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course_id required"})
		return
	}

	query := `
		SELECT
			t.id as task_id,
			t.title as title,
			t.task_mode as task_mode,
			DATE_FORMAT(t.due_at, '%Y-%m-%d %H:%i:%s') as due_at,
			CASE WHEN s.id IS NULL THEN FALSE ELSE TRUE END as submitted,
			CASE WHEN g.id IS NULL THEN FALSE ELSE TRUE END as graded
		FROM tasks t
		JOIN enrollments e ON e.course_id = t.course_id AND e.student_id = ?
		LEFT JOIN submissions s ON s.task_id = t.id AND s.student_id = ?
		LEFT JOIN grades g ON g.task_id = t.id AND g.student_id = ?
		WHERE t.course_id = ?
		  AND (g.id IS NULL) -- not graded yet
		ORDER BY t.due_at ASC
	`

	var rows []PendingTaskRow
	config.DB.Raw(query, studentID, studentID, studentID, courseID).Scan(&rows)
	c.JSON(http.StatusOK, rows)
}
