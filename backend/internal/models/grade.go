package models

import "time"

type Grade struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	TaskID     uint      `gorm:"column:task_id;not null" json:"task_id"`
	StudentID  uint      `gorm:"column:student_id;not null" json:"student_id"`
	TeacherID  uint      `gorm:"column:teacher_id;not null" json:"teacher_id"`
	Points     int       `gorm:"column:points;not null" json:"points"`                   // can be negative
	GradeLabel string    `gorm:"column:grade_label;type:varchar(20)" json:"grade_label"` // Excellent/Good/Penalty etc
	Feedback   string    `gorm:"column:feedback;type:text" json:"feedback"`
	GradedAt   time.Time `gorm:"column:graded_at;autoCreateTime" json:"graded_at"`
}

func (Grade) TableName() string { return "grades" }
