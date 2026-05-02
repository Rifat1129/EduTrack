package handlers

import (
	"encoding/csv"
	"net/http"
	"strconv"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

func ExportSessionCSV(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	sessionID := c.Param("id")

	// verify ownership
	var owns int
	config.DB.Raw(`SELECT COUNT(*) FROM class_sessions WHERE id = ? AND teacher_id = ?`, sessionID, teacherID).Scan(&owns)
	if owns == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Session not found or not yours"})
		return
	}

	// reuse attendance rows query
	type Row struct {
		StudentName  string
		UniversityID string
		EntryTime    *string
		EntryPoints  *int
		ExitTime     *string
		ExitPoints   *int
	}

	var rows []Row
	config.DB.Raw(`
		SELECT
			u.full_name as student_name,
			st.university_id as university_id,
			(SELECT DATE_FORMAT(se.scanned_at, '%Y-%m-%d %H:%i:%s')
			 FROM scan_events se
			 WHERE se.session_id = ? AND se.student_id = u.id AND se.type='entry' AND se.status='success'
			 ORDER BY se.scanned_at DESC LIMIT 1) as entry_time,
			(SELECT se.points_awarded
			 FROM scan_events se
			 WHERE se.session_id = ? AND se.student_id = u.id AND se.type='entry' AND se.status='success'
			 ORDER BY se.scanned_at DESC LIMIT 1) as entry_points,
			(SELECT DATE_FORMAT(se.scanned_at, '%Y-%m-%d %H:%i:%s')
			 FROM scan_events se
			 WHERE se.session_id = ? AND se.student_id = u.id AND se.type='exit' AND se.status='success'
			 ORDER BY se.scanned_at DESC LIMIT 1) as exit_time,
			(SELECT se.points_awarded
			 FROM scan_events se
			 WHERE se.session_id = ? AND se.student_id = u.id AND se.type='exit' AND se.status='success'
			 ORDER BY se.scanned_at DESC LIMIT 1) as exit_points
		FROM enrollments e
		JOIN users u ON u.id = e.student_id
		JOIN students st ON st.user_id = u.id
		JOIN class_sessions cs ON cs.course_id = e.course_id
		WHERE cs.id = ?
		ORDER BY student_name ASC
	`, sessionID, sessionID, sessionID, sessionID, sessionID).Scan(&rows)

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=session_"+sessionID+"_attendance.csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	_ = writer.Write([]string{"Student Name", "University ID", "Entry Time", "Entry Points", "Exit Time", "Exit Points"})

	for _, r := range rows {
		entryPoints := ""
		exitPoints := ""
		entryTime := ""
		exitTime := ""

		if r.EntryPoints != nil {
			entryPoints = strconv.Itoa(*r.EntryPoints)
		}
		if r.ExitPoints != nil {
			exitPoints = strconv.Itoa(*r.ExitPoints)
		}
		if r.EntryTime != nil {
			entryTime = *r.EntryTime
		}
		if r.ExitTime != nil {
			exitTime = *r.ExitTime
		}

		_ = writer.Write([]string{
			r.StudentName,
			r.UniversityID,
			entryTime,
			entryPoints,
			exitTime,
			exitPoints,
		})
	}
}
