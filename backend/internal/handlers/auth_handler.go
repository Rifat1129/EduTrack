package handlers

import (
	"net/http"

	"edutrack/internal/auth"
	"edutrack/internal/config"
	"edutrack/internal/models"

	"github.com/gin-gonic/gin"
)

type RegisterInput struct {
	FullName     string `json:"full_name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password" binding:"required,min=6"`
	Role         string `json:"role" binding:"required,oneof=student teacher"`
	UniversityID string `json:"university_id"` // For Student
	Designation  string `json:"designation"`   // For Teacher
}

func Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingUser models.User
	if err := config.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	hashedPassword, err := auth.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		FullName: input.FullName,
		Email:    input.Email,
		Password: hashedPassword,
		Role:     input.Role,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	if input.Role == "student" {
		student := models.Student{
			UserID:       user.ID,
			UniversityID: input.UniversityID,
		}
		config.DB.Create(&student)
	} else if input.Role == "teacher" {
		designation := "Lecturer" // default fallback
		if input.Designation != "" {
			designation = input.Designation
		}
		teacher := models.Teacher{
			UserID:      user.ID,
			Designation: designation,
		}
		config.DB.Create(&teacher)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user_id": user.ID,
	})
}

// ... (Login function as before)
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !auth.CheckPasswordHash(input.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Prepare user data to send back
	userData := gin.H{
		"id":        user.ID,
		"full_name": user.FullName,
		"email":     user.Email,
		"role":      user.Role,
	}

	// Role অনুযায়ী ডাটাবেস থেকে স্পেসিফিক ইনফো নেওয়া
	if user.Role == "student" {
		var student models.Student
		if err := config.DB.Where("user_id = ?", user.ID).First(&student).Error; err == nil {
			userData["university_id"] = student.UniversityID
		}
	} else if user.Role == "teacher" {
		var teacher models.Teacher
		if err := config.DB.Where("user_id = ?", user.ID).First(&teacher).Error; err == nil {
			userData["designation"] = teacher.Designation
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  userData,
	})
}
