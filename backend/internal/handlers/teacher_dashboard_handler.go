package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

func GetTeacherDashboard(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	// total students (unique enrollment in teacher's courses)
	var totalStudents int
	config.DB.Raw(`
		SELECT COUNT(DISTINCT e.student_id)
		FROM enrollments e
		JOIN courses c ON c.id = e.course_id
		WHERE c.teacher_id = ?
	`, teacherID).Scan(&totalStudents)

	// sessions count
	var sessionsCount int
	config.DB.Raw(`
		SELECT COUNT(*)
		FROM class_sessions
		WHERE teacher_id = ?
	`, teacherID).Scan(&sessionsCount)

	// total scans (all scan_events under teacher sessions)
	var totalScans int
	config.DB.Raw(`
		SELECT COUNT(*)
		FROM scan_events se
		JOIN class_sessions cs ON cs.id = se.session_id
		WHERE cs.teacher_id = ?
	`, teacherID).Scan(&totalScans)

	// avg attendance (simple): for latest 7 days -> present/enrolled average (optional)
	// We'll return a placeholder now; later can refine
	avgAttendance := 0.0

	c.JSON(http.StatusOK, gin.H{
		"total_students": totalStudents,
		"sessions_count": sessionsCount,
		"avg_attendance": avgAttendance,
		"total_scans":    totalScans,
	})
}

type AttendanceRow struct {
	StudentID    uint    `json:"student_id"`
	StudentName  string  `json:"student_name"`
	UniversityID string  `json:"university_id"`
	EntryTime    *string `json:"entry_time"`
	EntryPoints  *int    `json:"entry_points"`
	ExitTime     *string `json:"exit_time"`
	ExitPoints   *int    `json:"exit_points"`
}

func GetSessionAttendance(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	sessionID := c.Param("id")

	// ensure session belongs to teacher
	var count int
	config.DB.Raw(`SELECT COUNT(*) FROM class_sessions WHERE id = ? AND teacher_id = ?`, sessionID, teacherID).Scan(&count)
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Session not found or not yours"})
		return
	}

	var rows []AttendanceRow
	config.DB.Raw(`
		SELECT
			u.id as student_id,
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

	c.JSON(http.StatusOK, rows)
}
