package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

type TeacherTaskRow struct {
	ID          uint   `json:"id"`
	CourseCode  string `json:"course_code"`
	CourseTitle string `json:"course_title"`
	Title       string `json:"title"`
	Description string `json:"description"`
	TaskMode    string `json:"task_mode"`
	MaxPoints   int    `json:"max_points"`
	OpenAt      string `json:"open_at"`
	DueAt       string `json:"due_at"`
	Submitted   int    `json:"submitted"`
	Graded      int    `json:"graded"`
	Total       int    `json:"total"`
}

func ListTeacherTasks(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	var rows []TeacherTaskRow
	config.DB.Raw(`
		SELECT 
			t.id,
			c.code as course_code,
			c.title as course_title,
			t.title,
			t.description,
			t.task_mode,
			t.max_points,
			DATE_FORMAT(t.open_at, '%Y-%m-%d %H:%i') as open_at,
			DATE_FORMAT(t.due_at, '%Y-%m-%d %H:%i') as due_at,
			(SELECT COUNT(*) FROM submissions s WHERE s.task_id = t.id) as submitted,
			(SELECT COUNT(*) FROM grades g WHERE g.task_id = t.id) as graded,
			(SELECT COUNT(*) FROM enrollments e WHERE e.course_id = t.course_id AND e.status = 'enrolled') as total
		FROM tasks t
		JOIN courses c ON c.id = t.course_id
		WHERE t.teacher_id = ?
		ORDER BY t.id DESC
	`, teacherID).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}
