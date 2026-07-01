package user

import "time"

// UserProfileResponse represents the response with the current user's profile details
type UserProfileResponse struct {
	Username          string `json:"username"`
	Email             string `json:"email"`
	ProfilePictureUrl string `json:"profile_picture_url"`
}

// UserDashboardStats represents the response containing the dashboard statistics
type UserDashboardStats struct {
	TotalInterviewCount     int64   `json:"total_interview_count"`
	UpcomingInterviewCount  int64   `json:"upcoming_interview_count"`
	CompletedInterviewCount int64   `json:"completed_interview_count"`
	Username                string  `json:"username"`
	UserImage               string  `json:"user_image"`
	PassRate                float64 `json:"pass_rate"`
}

// UserOauthSetting represents an OAuth provider configuration setting
type UserOauthSetting struct {
	CreatedAt time.Time `json:"created_at"`
	Provider  string    `json:"provider"`
	UpdatedAt time.Time `json:"updated_at"`
}
