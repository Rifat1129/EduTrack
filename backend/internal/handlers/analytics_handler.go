package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

func GetWeeklyAttendance(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	courseID := c.Query("course_id")
	if courseID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course_id required"})
		return
	}

	// verify teacher owns course
	var owns int
	config.DB.Raw(`SELECT COUNT(*) FROM courses WHERE id = ? AND teacher_id = ?`, courseID, teacherID).Scan(&owns)
	if owns == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your course"})
		return
	}

	type Row struct {
		Day    string `json:"day"`
		OnTime int    `json:"on_time"`
		Late   int    `json:"late"`
	}

	var rows []Row
	config.DB.Raw(`
		SELECT 
			DATE_FORMAT(se.scanned_at, '%a') as day,
			SUM(CASE WHEN se.type='entry' AND se.points_awarded=10 THEN 1 ELSE 0 END) as on_time,
			SUM(CASE WHEN se.type='entry' AND se.points_awarded<10 THEN 1 ELSE 0 END) as late
		FROM scan_events se
		JOIN class_sessions cs ON cs.id = se.session_id
		WHERE cs.course_id = ? 
		  AND cs.teacher_id = ?
		  AND se.scanned_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
		GROUP BY day
		ORDER BY MIN(se.scanned_at) ASC
	`, courseID, teacherID).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}

func GetScanDistribution(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	courseID := c.Query("course_id")
	if courseID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course_id required"})
		return
	}

	type Row struct {
		Type  string `json:"type"`
		Count int    `json:"count"`
	}

	var rows []Row
	config.DB.Raw(`
		SELECT se.type as type, COUNT(*) as count
		FROM scan_events se
		JOIN class_sessions cs ON cs.id = se.session_id
		WHERE cs.course_id = ? AND cs.teacher_id = ?
		GROUP BY se.type
	`, courseID, teacherID).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}

func GetTopPerformers(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	courseID := c.Query("course_id")
	if courseID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course_id required"})
		return
	}

	type Row struct {
		StudentID uint   `json:"student_id"`
		FullName  string `json:"full_name"`
		Points    int    `json:"points"`
	}

	var rows []Row
	config.DB.Raw(`
		SELECT 
			pl.student_id,
			u.full_name,
			SUM(pl.points) as points
		FROM points_ledgers pl
		JOIN users u ON u.id = pl.student_id
		JOIN enrollments e ON e.student_id = pl.student_id AND e.course_id = ?
		JOIN courses c ON c.id = e.course_id
		WHERE c.teacher_id = ?
		GROUP BY pl.student_id, u.full_name
		ORDER BY points DESC
		LIMIT 10
	`, courseID, teacherID).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}
