package models

type Teacher struct {
	UserID      uint   `gorm:"primaryKey" json:"user_id"`
	Designation string `gorm:"column:designation;type:varchar(100);default:'Lecturer'" json:"designation"`
	User        User   `gorm:"foreignKey:UserID"`
}
