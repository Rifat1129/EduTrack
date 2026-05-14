package main

import (
	"log"
	"os"

	"edutrack/internal/config"
	"edutrack/internal/handlers"
	"edutrack/internal/middleware"

	"github.com/gin-contrib/cors" // ✅ CORS ইম্পোর্ট করা হলো
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found (using system env variables)")
	}

	// Connect to Database
	config.ConnectDB()

	r := gin.Default()

	// ✅ CORS Setup (যাতে লাইভ Frontend থেকে Backend কে কল করা যায়)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // প্রোডাকশনে নির্দিষ্ট ডোমেইন দেওয়া ভালো, তবে প্রেজেন্টেশনের জন্য সব অ্যালাউ রাখা হলো
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "EduTrack Backend is running!"})
	})

	// Serve Uploaded Files
	r.Static("/uploads", "./uploads")

	// ---------------- Public Routes ---------------- //
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", handlers.Register)
		authGroup.POST("/login", handlers.Login)
	}

	// ---------------- Protected Base Group ---------------- //
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		// Common (Both roles)
		protected.GET("/me", handlers.GetMe)
		protected.GET("/leaderboard", handlers.GetLeaderboard)
	}

	// ---------------- Student-only Group ---------------- //
	student := r.Group("/api")
	student.Use(middleware.AuthMiddleware(), middleware.RequireRole("student"))
	{
		// Enrollment & Courses
		student.GET("/student/courses", handlers.ListStudentCourses)
		student.POST("/courses/join", handlers.JoinCourse)

		// Scan, History & Points
		student.POST("/scan", handlers.StudentScan)
		student.GET("/me/history", handlers.GetMyScanHistory)
		student.GET("/me/points", handlers.GetMyPoints)

		// Tasks
		student.GET("/me/tasks", handlers.ListMyTasks)
		student.POST("/tasks/:id/submit", handlers.SubmitTask)

		// Marks & Pending
		student.GET("/me/marks", handlers.GetMyMarks)
		student.GET("/me/pending", handlers.GetMyPending)

		// Dashboard
		student.GET("/student/dashboard", handlers.GetStudentDashboard)
	}

	// ---------------- Teacher-only Group ---------------- //
	teacher := r.Group("/api")
	teacher.Use(middleware.AuthMiddleware(), middleware.RequireRole("teacher"))
	{
		// Courses
		teacher.POST("/courses", handlers.CreateCourse)
		teacher.GET("/teacher/courses", handlers.ListTeacherCourses)

		// Sessions
		teacher.POST("/sessions", handlers.CreateSession)
		teacher.POST("/sessions/:id/start", handlers.StartSession)
		teacher.POST("/sessions/:id/end", handlers.EndSession)
		teacher.GET("/teacher/sessions", handlers.ListTeacherSessions)

		// QR Code Generation
		teacher.POST("/qrcodes", handlers.GenerateQRCode)

		// Dashboard & Analytics
		teacher.GET("/teacher/dashboard", handlers.GetTeacherDashboard)
		teacher.GET("/teacher/analytics/weekly-attendance", handlers.GetWeeklyAttendance)
		teacher.GET("/teacher/analytics/scan-distribution", handlers.GetScanDistribution)
		teacher.GET("/teacher/analytics/top-performers", handlers.GetTopPerformers)

		// Attendance & Export
		teacher.GET("/teacher/sessions/:id/attendance", handlers.GetSessionAttendance)
		teacher.GET("/teacher/sessions/:id/export", handlers.ExportSessionCSV)

		// Tasks & Grading
		teacher.POST("/tasks", handlers.CreateTask)
		teacher.GET("/teacher/pending-submissions", handlers.GetPendingSubmissions)
		teacher.POST("/teacher/grade", handlers.GiveGrade)
		teacher.GET("/tasks/:id/export", handlers.ExportTaskSubmissions)
		teacher.POST("/qrcodes/auto", handlers.GenerateAutoRefreshQR)
		teacher.POST("/bonus/penalty", handlers.ApplyBonusPenalty)
		teacher.GET("/teacher/tasks", handlers.ListTeacherTasks)
	}

	// ---------------- Start Server ---------------- //
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server running on port %s", port)
	r.Run(":" + port)
}
