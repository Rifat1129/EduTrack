package handlers

import (
	"net/http"
	"time"

	"edutrack/internal/config"
	"edutrack/internal/models"

	"github.com/gin-gonic/gin"
)

func ApplyBonusPenalty(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	type Input struct {
		SessionID     uint `json:"session_id" binding:"required"`
		QRCodeID      uint `json:"qr_code_id" binding:"required"`
		PenaltyPoints int  `json:"penalty_points"` // e.g. -10
	}

	var input Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify session
	var session models.ClassSession
	if err := config.DB.Where("id = ? AND teacher_id = ?", input.SessionID, teacherID).First(&session).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Session not found"})
		return
	}

	// Get all enrolled students
	type StudentRow struct {
		StudentID uint
	}
	var enrolled []StudentRow
	config.DB.Raw(`
		SELECT e.student_id 
		FROM enrollments e 
		WHERE e.course_id = ? AND e.status = 'enrolled'
	`, session.CourseID).Scan(&enrolled)

	// Get students who DID scan the bonus QR
	type ScannedRow struct {
		StudentID uint
	}
	var scanned []ScannedRow
	config.DB.Raw(`
		SELECT student_id 
		FROM scan_events 
		WHERE qr_code_id = ? AND status = 'success'
	`, input.QRCodeID).Scan(&scanned)

	scannedMap := make(map[uint]bool)
	for _, s := range scanned {
		scannedMap[s.StudentID] = true
	}

	// Apply penalty to students who did NOT scan
	penaltyCount := 0
	penaltyPts := input.PenaltyPoints
	if penaltyPts == 0 {
		penaltyPts = -10 // default
	}

	for _, e := range enrolled {
		if !scannedMap[e.StudentID] {
			// This student missed the bonus QR → penalty
			ledger := models.PointsLedger{
				StudentID:  e.StudentID,
				SourceType: "penalty_bonus",
				SourceID:   input.QRCodeID,
				Points:     penaltyPts,
				CreatedAt:  time.Now(),
			}
			config.DB.Create(&ledger)
			penaltyCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Penalty applied",
		"students_penalized": penaltyCount,
		"students_rewarded":  len(scanned),
		"penalty_points":     penaltyPts,
	})
}
