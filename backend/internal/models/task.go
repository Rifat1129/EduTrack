package models

import "time"

type Task struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CourseID    uint      `gorm:"column:course_id;not null" json:"course_id"`
	SessionID   *uint     `gorm:"column:session_id" json:"session_id"` // nullable
	TeacherID   uint      `gorm:"column:teacher_id;not null" json:"teacher_id"`
	Title       string    `gorm:"column:title;not null" json:"title"`
	Description string    `gorm:"column:description" json:"description"`
	TaskMode    string    `gorm:"column:task_mode;type:varchar(20);not null" json:"task_mode"` // scan_only, file_required
	OpenAt      time.Time `gorm:"column:open_at" json:"open_at"`
	DueAt       time.Time `gorm:"column:due_at" json:"due_at"`
	MaxPoints   int       `gorm:"column:max_points;default:0" json:"max_points"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}
