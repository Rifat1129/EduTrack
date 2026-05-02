package models

import "time"

type Enrollment struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CourseID   uint      `gorm:"column:course_id" json:"course_id"`
	StudentID  uint      `gorm:"column:student_id" json:"student_id"`
	Status     string    `gorm:"column:status;default:'enrolled'" json:"status"`
	EnrolledAt time.Time `gorm:"column:enrolled_at" json:"enrolled_at"`
}
