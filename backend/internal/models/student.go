package models

type Student struct {
	UserID       uint   `gorm:"primaryKey" json:"user_id"`
	UniversityID string `gorm:"unique;not null" json:"university_id"`
	User         User   `gorm:"foreignKey:UserID"`
}
