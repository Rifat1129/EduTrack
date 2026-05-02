package handlers

import (
	"net/http"

	"edutrack/internal/config"

	"github.com/gin-gonic/gin"
)

type LeaderboardEntry struct {
	StudentID   uint   `json:"student_id"`
	FullName    string `json:"full_name"`
	TotalPoints int    `json:"total_points"`
	Rank        int    `json:"rank"`
}

func GetLeaderboard(c *gin.Context) {
	type result struct {
		StudentID   uint
		FullName    string
		TotalPoints int
	}

	var results []result

	query := `
		SELECT 
			p.student_id,
			u.full_name,
			SUM(p.points) as total_points
		FROM points_ledgers p
		JOIN users u ON u.id = p.student_id
		GROUP BY p.student_id, u.full_name
		ORDER BY total_points DESC
		LIMIT 50
	`

	config.DB.Raw(query).Scan(&results)

	var leaderboard []LeaderboardEntry
	for i, r := range results {
		leaderboard = append(leaderboard, LeaderboardEntry{
			StudentID:   r.StudentID,
			FullName:    r.FullName,
			TotalPoints: r.TotalPoints,
			Rank:        i + 1,
		})
	}

	c.JSON(http.StatusOK, leaderboard)
}
