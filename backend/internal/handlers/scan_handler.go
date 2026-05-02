package handlers

import (
	"net/http"
	"time"

	"edutrack/internal/config"
	"edutrack/internal/models"
	"edutrack/internal/services"

	"github.com/gin-gonic/gin"
)

type ScanInput struct {
	Token string `json:"token" binding:"required"`
}

func StudentScan(c *gin.Context) {
	var input ScanInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	studentID := c.GetUint("user_id")

	// 1. QR Code খুঁজে বের করা
	var qr models.QRCode
	if err := config.DB.Where("token = ? AND active = ?", input.Token, true).First(&qr).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or inactive QR code"})
		return
	}

	// 2. QR এর মেয়াদ শেষ কিনা চেক
	if time.Now().After(qr.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "QR code has expired"})
		return
	}

	// 3. Session চেক করা
	var session models.ClassSession
	if err := config.DB.First(&session, qr.SessionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	if session.Status != "live" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session is not active"})
		return
	}

	// enrollment check: student must be enrolled in course
	var enrolledCount int
	config.DB.Raw(`
	SELECT COUNT(*) 
	FROM enrollments 
	WHERE course_id = ? AND student_id = ? AND status = 'enrolled'
`, session.CourseID, studentID).Scan(&enrolledCount)

	if enrolledCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not enrolled in this course"})
		return
	}

	// 4. Duplicate scan চেক করা (একই টাইপের একাধিকবার স্ক্যান করা যাবে না)
	var existingScan models.ScanEvent
	if err := config.DB.Where("session_id = ? AND student_id = ? AND type = ?",
		qr.SessionID, studentID, qr.Type).First(&existingScan).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already scanned this QR type"})
		return
	}

	// 5. Points নির্ধারণ (এখন শুধু QR এর points নিচ্ছি, পরে Entry/Exit এর জন্য time-based লজিক যোগ করব)
	var points int

	switch qr.Type {
	case "entry":
		points = services.CalculateEntryPoints(session.StartTime, time.Now())
	case "exit":
		points = services.CalculateExitPoints(session.EndTime, time.Now())
	case "task", "prep":
		points = qr.Points
	default:
		points = 0
	}

	// 6. Scan Event রেকর্ড করা
	scanEvent := models.ScanEvent{
		SessionID:     qr.SessionID,
		CourseID:      session.CourseID,
		StudentID:     studentID,
		QRCodeID:      qr.ID,
		Type:          qr.Type,
		ScannedAt:     time.Now(),
		PointsAwarded: points,
		Status:        "success",
	}

	if err := config.DB.Create(&scanEvent).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record scan"})
		return
	}

	// 7. Points Ledger এ entry
	ledger := models.PointsLedger{
		StudentID:  studentID,
		SourceType: "scan_" + qr.Type,
		SourceID:   scanEvent.ID,
		Points:     points,
		CreatedAt:  time.Now(),
	}

	if err := config.DB.Create(&ledger).Error; err != nil {
		c.JSON(500, gin.H{
			"error":    "Failed to add points ledger",
			"db_error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Scan successful",
		"type":           qr.Type,
		"points_awarded": points,
		"scanned_at":     scanEvent.ScannedAt,
	})
}
