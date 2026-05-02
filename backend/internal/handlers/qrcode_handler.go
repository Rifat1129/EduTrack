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
	Type      string `json:"type" binding:"required,oneof=entry task exit prep"`
	Duration  int    `json:"duration"` // in minutes, default 15
	Points    int    `json:"points"`   // optional
}

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

	// Set expiry
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
		"qr_string": token, // এটাই QR এ encode করা হবে
	})
}
