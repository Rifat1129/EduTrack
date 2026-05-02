package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

type TeacherCourseRow struct {
	ID       uint   `json:"id"`
	Code     string `json:"code"`
	Title    string `json:"title"`
	JoinCode string `json:"join_code"`
	IsActive bool   `json:"is_active"`
}

func ListTeacherCourses(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	var rows []TeacherCourseRow
	config.DB.Raw(`
		SELECT id, code, title, join_code, is_active
		FROM courses
		WHERE teacher_id = ?
		ORDER BY id DESC
	`, teacherID).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}
