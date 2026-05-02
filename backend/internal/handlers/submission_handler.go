package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"edutrack/internal/config"
	"edutrack/internal/models"

	"github.com/gin-gonic/gin"
)

func SubmitTask(c *gin.Context) {
	studentID := c.GetUint("user_id")
	taskID := c.Param("id")

	var task models.Task
	if err := config.DB.First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	now := time.Now()
	if now.Before(task.OpenAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task not open yet"})
		return
	}

	// check already submitted
	var existing models.Submission
	if err := config.DB.Where("task_id = ? AND student_id = ?", task.ID, studentID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Already submitted"})
		return
	}

	var fileURL *string = nil

	if task.TaskMode == "file_required" {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File is required for this task"})
			return
		}

		_ = os.MkdirAll("uploads", 0755)
		filename := fmt.Sprintf("task_%d_student_%d_%d%s", task.ID, studentID, time.Now().Unix(), filepath.Ext(file.Filename))
		savePath := filepath.Join("uploads", filename)

		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		url := "/uploads/" + filename
		fileURL = &url
	}

	status := "submitted"
	if now.After(task.DueAt) {
		status = "late"
	}

	sub := models.Submission{
		TaskID:    task.ID,
		StudentID: studentID,
		FileURL:   fileURL,
		Status:    status,
	}

	if err := config.DB.Create(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit"})
		return
	}

	c.JSON(http.StatusOK, sub)
}
