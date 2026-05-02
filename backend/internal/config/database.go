package config

import (
	"fmt"
	"log"
	"os"

	"edutrack/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	DB = db

	// Auto Migrate Tables
	// Auto Migrate Tables
	err = DB.AutoMigrate(
		&models.User{},
		&models.Student{},
		&models.Teacher{},
		&models.Course{},
		&models.Enrollment{},
		&models.ClassSession{}, // ← এই লাইনটা যোগ করো
		&models.QRCode{},
		&models.ScanEvent{},
		&models.PointsLedger{},
		&models.Task{},
		&models.Submission{},
		&models.Grade{},
	)
	if err != nil {
		log.Fatal("Migration Error: ", err)
	}

	fmt.Println("✅ Database connected & tables migrated successfully!")
}
