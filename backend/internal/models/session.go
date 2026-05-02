package models

import "time"

type ClassSession struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CourseID  uint      `gorm:"column:course_id" json:"course_id"`
	TeacherID uint      `gorm:"column:teacher_id" json:"teacher_id"`
	Room      string    `gorm:"column:room" json:"room"`
	StartTime time.Time `gorm:"column:start_time" json:"start_time"`
	EndTime   time.Time `gorm:"column:end_time" json:"end_time"`
	Status    string    `gorm:"column:status;default:'scheduled'" json:"status"` // scheduled, live, ended
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}
