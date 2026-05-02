package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

func GetMyPoints(c *gin.Context) {
	studentID := c.GetUint("user_id")

	type result struct {
		TotalPoints int
	}

	var res result

	config.DB.Raw(`
		SELECT COALESCE(SUM(points), 0) as total_points 
		FROM points_ledgers 
		WHERE student_id = ?
	`, studentID).Scan(&res)

	c.JSON(http.StatusOK, gin.H{
		"student_id":   studentID,
		"total_points": res.TotalPoints,
	})
}
