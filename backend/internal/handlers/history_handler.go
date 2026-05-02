package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

type HistoryRow struct {
	ID            uint   `json:"id"`
	Type          string `json:"type"`
	ScannedAt     string `json:"scanned_at"`
	PointsAwarded int    `json:"points_awarded"`
	CourseCode    string `json:"course_code"`
	CourseTitle   string `json:"course_title"`
	Room          string `json:"room"`
}

func GetMyScanHistory(c *gin.Context) {
	studentID := c.GetUint("user_id")
	filterType := c.Query("type") // entry/task/exit/prep/all

	baseQuery := `
		SELECT 
			se.id,
			se.type,
			DATE_FORMAT(se.scanned_at, '%Y-%m-%d %H:%i:%s') as scanned_at,
			se.points_awarded,
			co.code as course_code,
			co.title as course_title,
			cs.room as room
		FROM scan_events se
		JOIN class_sessions cs ON cs.id = se.session_id
		JOIN courses co ON co.id = se.course_id
		WHERE se.student_id = ?
	`

	args := []interface{}{studentID}

	if filterType != "" && filterType != "all" {
		baseQuery += " AND se.type = ?"
		args = append(args, filterType)
	}

	baseQuery += " ORDER BY se.scanned_at DESC LIMIT 100"

	var rows []HistoryRow
	config.DB.Raw(baseQuery, args...).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}
