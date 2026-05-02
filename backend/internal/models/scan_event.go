package models

import "time"

type ScanEvent struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	SessionID     uint      `gorm:"column:session_id" json:"session_id"`
	CourseID      uint      `gorm:"column:course_id" json:"course_id"`
	StudentID     uint      `gorm:"column:student_id" json:"student_id"`
	QRCodeID      uint      `gorm:"column:qr_code_id" json:"qr_code_id"`
	Type          string    `gorm:"column:type" json:"type"`
	ScannedAt     time.Time `gorm:"column:scanned_at" json:"scanned_at"`
	PointsAwarded int       `gorm:"column:points_awarded" json:"points_awarded"`
	Status        string    `gorm:"column:status" json:"status"`
	RejectReason  string    `gorm:"column:reject_reason" json:"reject_reason"`
}
