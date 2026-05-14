package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"edutrack/internal/config"
	"edutrack/internal/models"

	"github.com/gin-gonic/gin"
)

type GenerateQRInput struct {
	SessionID uint   `json:"session_id" binding:"required"`
	Type      string `json:"type" binding:"required,oneof=entry task exit prep bonus"`
	Duration  int    `json:"duration"`
	Points    int    `json:"points"`
}

// ✅ Normal QR Generate (Teacher manually generates, stays for set duration)
func GenerateQRCode(c *gin.Context) {
	var input GenerateQRInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	teacherID := c.GetUint("user_id")

	// Check if session belongs to this teacher
	var session models.ClassSession
	if err := config.DB.Where("id = ? AND teacher_id = ?", input.SessionID, teacherID).First(&session).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Session not found or not yours"})
		return
	}

	// Generate random token
	tokenBytes := make([]byte, 16)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	// Set expiry (default 15 minutes)
	duration := 15
	if input.Duration > 0 {
		duration = input.Duration
	}
	expiresAt := time.Now().Add(time.Duration(duration) * time.Minute)

	qr := models.QRCode{
		SessionID: input.SessionID,
		Type:      input.Type,
		Token:     token,
		ExpiresAt: expiresAt,
		Points:    input.Points,
		Active:    true,
	}

	if err := config.DB.Create(&qr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate QR"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "QR Code generated successfully",
		"qr_code":   qr,
		"qr_string": token,
	})
}

// ✅ Auto-Refresh QR (10 seconds only, old QR deactivated — screenshot proof!)
func GenerateAutoRefreshQR(c *gin.Context) {
	var input GenerateQRInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	teacherID := c.GetUint("user_id")

	// Check session ownership
	var session models.ClassSession
	if err := config.DB.Where("id = ? AND teacher_id = ?", input.SessionID, teacherID).First(&session).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Session not found or not yours"})
		return
	}

	// ✅ Deactivate ALL previous QR codes of same type for this session
	config.DB.Exec(`
		UPDATE qr_codes SET active = false 
		WHERE session_id = ? AND type = ? AND active = true
	`, input.SessionID, input.Type)

	// Generate new token
	tokenBytes := make([]byte, 16)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	// ✅ QR valid for only 10 seconds
	expiresAt := time.Now().Add(10 * time.Second)

	qr := models.QRCode{
		SessionID: input.SessionID,
		Type:      input.Type,
		Token:     token,
		ExpiresAt: expiresAt,
		Points:    input.Points,
		Active:    true,
	}

	if err := config.DB.Create(&qr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate QR"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"qr_code":   qr,
		"qr_string": token,
	})
}
