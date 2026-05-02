package models

import "time"

type QRCode struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SessionID uint      `gorm:"column:session_id" json:"session_id"`
	Type      string    `gorm:"column:type" json:"type"` // entry, task, exit, prep
	Token     string    `gorm:"column:token;unique" json:"token"`
	ExpiresAt time.Time `gorm:"column:expires_at" json:"expires_at"`
	Points    int       `gorm:"column:points;default:0" json:"points"`
	Active    bool      `gorm:"column:active;default:true" json:"active"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}
