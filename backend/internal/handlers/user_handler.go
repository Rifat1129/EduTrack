package handlers

import (
	"net/http"

	"edutrack/internal/config"
	"edutrack/internal/models"

	"github.com/gin-gonic/gin"
)

func GetMe(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("role")

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	response := gin.H{
		"id":        user.ID,
		"full_name": user.FullName,
		"email":     user.Email,
		"role":      user.Role,
	}

	if role == "student" {
		var student models.Student
		if err := config.DB.Where("user_id = ?", user.ID).First(&student).Error; err == nil {
			response["university_id"] = student.UniversityID
		}
	} else if role == "teacher" {
		var teacher models.Teacher
		if err := config.DB.Where("user_id = ?", user.ID).First(&teacher).Error; err == nil {
			response["designation"] = teacher.Designation
			response["department"] = "CSE Department" // Department static রাখলাম, চাইলে এটাও ডাইনামিক করা যাবে
		}
	}

	c.JSON(http.StatusOK, response)
}
