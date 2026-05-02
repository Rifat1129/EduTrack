package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

type StudentCourseRow struct {
	ID    uint   `json:"id"`
	Code  string `json:"code"`
	Title string `json:"title"`
}

func ListStudentCourses(c *gin.Context) {
	studentID := c.GetUint("user_id")

	var rows []StudentCourseRow
	config.DB.Raw(`
		SELECT c.id, c.code, c.title
		FROM courses c
		JOIN enrollments e ON e.course_id = c.id
		WHERE e.student_id = ? AND e.status = 'enrolled'
		ORDER BY c.id DESC
	`, studentID).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}
