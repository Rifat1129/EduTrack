package models

import "time"

type PointsLedger struct {
	ID         uint      `gorm:"primaryKey;column:id" json:"id"`
	StudentID  uint      `gorm:"column:student_id;not null" json:"student_id"`
	SourceType string    `gorm:"column:source_type;type:varchar(50);not null" json:"source_type"`
	SourceID   uint      `gorm:"column:source_id;not null" json:"source_id"`
	Points     int       `gorm:"column:points;not null" json:"points"`
	CreatedAt  time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (PointsLedger) TableName() string {
	return "points_ledgers"
}
