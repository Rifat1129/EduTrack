package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

type TeacherSessionRow struct {
	ID          uint   `json:"id"`
	CourseID    uint   `json:"course_id"`
	CourseCode  string `json:"course_code"`
	CourseTitle string `json:"course_title"`
	Room        string `json:"room"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	Status      string `json:"status"`
}

func ListTeacherSessions(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	var rows []TeacherSessionRow
	config.DB.Raw(`
		SELECT 
			cs.id,
			cs.course_id,
			c.code as course_code,
			c.title as course_title,
			cs.room,
			DATE_FORMAT(cs.start_time, '%Y-%m-%d %H:%i:%s') as start_time,
			DATE_FORMAT(cs.end_time, '%Y-%m-%d %H:%i:%s') as end_time,
			cs.status
		FROM class_sessions cs
		JOIN courses c ON c.id = cs.course_id
		WHERE cs.teacher_id = ?
		ORDER BY cs.id DESC
		LIMIT 50
	`, teacherID).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}
