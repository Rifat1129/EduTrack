package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

type RecentScanRow struct {
	ID            uint   `json:"id"`
	Type          string `json:"type"`
	ScannedAt     string `json:"scanned_at"`
	PointsAwarded int    `json:"points_awarded"`
	CourseCode    string `json:"course_code"`
	CourseTitle   string `json:"course_title"`
}

func GetStudentDashboard(c *gin.Context) {
	studentID := c.GetUint("user_id")

	// total points
	var totalPoints int
	config.DB.Raw(`SELECT COALESCE(SUM(points),0) FROM points_ledgers WHERE student_id = ?`, studentID).Scan(&totalPoints)

	// classes attended (distinct sessions where entry scanned)
	var classesAttended int
	config.DB.Raw(`
		SELECT COUNT(DISTINCT session_id)
		FROM scan_events
		WHERE student_id = ? AND type = 'entry' AND status = 'success'
	`, studentID).Scan(&classesAttended)

	// late count (entry points < 10 considered late)
	var lateCount int
	config.DB.Raw(`
		SELECT COUNT(*)
		FROM scan_events
		WHERE student_id = ? AND type='entry' AND status='success' AND points_awarded < 10
	`, studentID).Scan(&lateCount)

	// on time count
	var onTimeCount int
	config.DB.Raw(`
		SELECT COUNT(*)
		FROM scan_events
		WHERE student_id = ? AND type='entry' AND status='success' AND points_awarded = 10
	`, studentID).Scan(&onTimeCount)

	// consistency rate = onTime / total entry * 100
	var totalEntry int
	config.DB.Raw(`
		SELECT COUNT(*)
		FROM scan_events
		WHERE student_id = ? AND type='entry' AND status='success'
	`, studentID).Scan(&totalEntry)

	consistency := 0.0
	if totalEntry > 0 {
		consistency = (float64(onTimeCount) / float64(totalEntry)) * 100.0
	}

	// recent scans (last 5)
	var recent []RecentScanRow
	config.DB.Raw(`
		SELECT 
			se.id,
			se.type,
			DATE_FORMAT(se.scanned_at, '%Y-%m-%d %H:%i:%s') as scanned_at,
			se.points_awarded,
			c.code as course_code,
			c.title as course_title
		FROM scan_events se
		JOIN courses c ON c.id = se.course_id
		WHERE se.student_id = ?
		ORDER BY se.scanned_at DESC
		LIMIT 5
	`, studentID).Scan(&recent)

	c.JSON(http.StatusOK, gin.H{
		"total_points":     totalPoints,
		"classes_attended": classesAttended,
		"late_count":       lateCount,
		"consistency_rate": consistency,
		"recent_scans":     recent,
	})
}
