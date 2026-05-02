package models

import "time"

type Course struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Code      string    `gorm:"column:code;unique;not null" json:"code"`
	Title     string    `gorm:"column:title;not null" json:"title"`
	TeacherID uint      `gorm:"column:teacher_id" json:"teacher_id"`
	JoinCode  string    `gorm:"column:join_code;unique" json:"join_code"`
	IsActive  bool      `gorm:"column:is_active;default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}
