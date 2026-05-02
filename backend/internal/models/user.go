package models

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Role      string    `gorm:"column:role;type:varchar(20);not null" json:"role"`
	FullName  string    `gorm:"column:full_name;not null" json:"full_name"`
	Email     string    `gorm:"column:email;unique;not null" json:"email"`
	Password  string    `gorm:"column:password;not null" json:"-"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}
