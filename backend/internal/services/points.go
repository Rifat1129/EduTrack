package services

import "time"

// Entry points based on minutes late
func CalculateEntryPoints(sessionStart time.Time, scannedAt time.Time) int {
	diff := scannedAt.Sub(sessionStart)
	minutesLate := int(diff.Minutes())

	if minutesLate <= 10 {
		return 10
	}
	if minutesLate <= 20 {
		return 5
	}
	if minutesLate <= 30 {
		return 2
	}
	return 0
}

// Exit points: on/before end time => 5 else 0
func CalculateExitPoints(sessionEnd time.Time, scannedAt time.Time) int {
	if scannedAt.After(sessionEnd) {
		return 0
	}
	return 5
}
