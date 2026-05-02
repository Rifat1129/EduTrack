package models

import "time"

type Submission struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TaskID      uint      `gorm:"column:task_id;not null" json:"task_id"`
	StudentID   uint      `gorm:"column:student_id;not null" json:"student_id"`
	SubmittedAt time.Time `gorm:"column:submitted_at;autoCreateTime" json:"submitted_at"`
	FileURL     *string   `gorm:"column:file_url" json:"file_url"`                                  // nullable
	Status      string    `gorm:"column:status;type:varchar(20);default:'submitted'" json:"status"` // submitted/late
}
