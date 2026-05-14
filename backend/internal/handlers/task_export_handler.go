package handlers

import (
	"encoding/csv"
	"net/http"
	"strconv"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

func ExportTaskSubmissions(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	taskID := c.Param("id")

	// Verify task belongs to teacher
	var owns int
	config.DB.Raw(`SELECT COUNT(*) FROM tasks WHERE id = ? AND teacher_id = ?`, taskID, teacherID).Scan(&owns)
	if owns == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Task not found or not yours"})
		return
	}

	type Row struct {
		StudentName  string
		UniversityID string
		SubmittedAt  *string
		FileURL      *string
		Status       string
		IsGraded     bool
		Points       *int
		GradeLabel   *string
	}

	var rows []Row
	config.DB.Raw(`
		SELECT
			u.full_name as student_name,
			st.university_id,
			DATE_FORMAT(sub.submitted_at, '%Y-%m-%d %H:%i:%s') as submitted_at,
			sub.file_url,
			COALESCE(sub.status, 'not submitted') as status,
			CASE WHEN g.id IS NOT NULL THEN true ELSE false END as is_graded,
			g.points,
			g.grade_label
		FROM enrollments e
		JOIN users u ON u.id = e.student_id
		JOIN students st ON st.user_id = u.id
		JOIN tasks t ON t.course_id = e.course_id
		LEFT JOIN submissions sub ON sub.task_id = t.id AND sub.student_id = u.id
		LEFT JOIN grades g ON g.task_id = t.id AND g.student_id = u.id
		WHERE t.id = ?
		ORDER BY u.full_name ASC
	`, taskID).Scan(&rows)

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=task_"+taskID+"_submissions.csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	_ = writer.Write([]string{"Student Name", "University ID", "Submitted At", "File URL", "Status", "Graded", "Points", "Grade"})

	for _, r := range rows {
		submittedAt := "Not Submitted"
		if r.SubmittedAt != nil {
			submittedAt = *r.SubmittedAt
		}
		fileURL := ""
		if r.FileURL != nil {
			fileURL = *r.FileURL
		}
		graded := "No"
		if r.IsGraded {
			graded = "Yes"
		}
		pts := ""
		if r.Points != nil {
			pts = strconv.Itoa(*r.Points)
		}
		grade := ""
		if r.GradeLabel != nil {
			grade = *r.GradeLabel
		}

		_ = writer.Write([]string{
			r.StudentName,
			r.UniversityID,
			submittedAt,
			fileURL,
			r.Status,
			graded,
			pts,
			grade,
		})
	}
}
