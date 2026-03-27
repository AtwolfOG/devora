package email

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"net"
	"net/smtp"
	"time"

	"github.com/AtwolfOG/devora/internal/config"
)

// Config holds SMTP and app configuration.
type Config struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string // Gmail address, e.g. you@gmail.com
	SMTPPassword string // Gmail App Password (not your account password)
	AppName      string
	BaseURL      string // e.g. https://yourbrand.com
}

// EmailData is passed into the HTML template.
type EmailData struct {
	AppName          string
	RecipientName    string
	VerificationLink string
	ExpiryMinutes    int
	Year             int
}

const emailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: #f0ede6; font-family: 'DM Sans', sans-serif; color: #1a1a1a; padding: 40px 20px; }
    .email-wrapper { max-width: 560px; width: 100%; margin: 0 auto; }
    .email-card { background: #fffdf9; border: 1px solid #d9d3c5; border-radius: 4px; overflow: hidden; box-shadow: 6px 6px 0 #c8bfaf; }
    .header { background: #1a1a1a; padding: 36px 48px; text-align: center; }
    .logo { font-family: 'DM Serif Display', serif; font-size: 22px; color: #f0ede6; letter-spacing: 0.05em; }
    .logo span { color: #e8c97e; }
    .body { padding: 48px; }
    .eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #8a7f6e; margin-bottom: 14px; }
    .heading { font-family: 'DM Serif Display', serif; font-size: 32px; line-height: 1.15; color: #1a1a1a; margin-bottom: 20px; }
    .body-text { font-size: 15px; line-height: 1.7; color: #4a4540; margin-bottom: 36px; }
    .btn-wrapper { text-align: center; margin-bottom: 36px; }
    .btn { display: inline-block; background: #1a1a1a; color: #f0ede6; font-size: 14px; font-weight: 500; letter-spacing: 0.06em; text-decoration: none; padding: 16px 40px; border-radius: 2px; }
    .divider { border: none; border-top: 1px solid #e0dbd0; margin: 36px 0; }
    .link-fallback { font-size: 13px; color: #8a7f6e; line-height: 1.6; }
    .link-fallback a { color: #5a7a5e; word-break: break-all; }
    .expiry { display: flex; align-items: center; gap: 10px; background: #f5f0e6; border-left: 3px solid #e8c97e; padding: 14px 18px; font-size: 13px; color: #6a5f48; margin-top: 28px; }
    .footer { background: #f5f0e6; border-top: 1px solid #d9d3c5; padding: 24px 48px; text-align: center; font-size: 12px; color: #9a9080; line-height: 1.7; }
    .footer a { color: #7a7060; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      <div class="header">
        <div class="logo">{{.AppName}}</div>
      </div>
      <div class="body">
        <p class="eyebrow">Email Verification</p>
        <h1 class="heading">Confirm your<br>email address</h1>
        <p class="body-text">
          Hi {{.RecipientName}}, thanks for signing up! To complete your registration
          and activate your account, please verify your email address by clicking the button below.
        </p>
        <div class="btn-wrapper">
          <a href="{{.VerificationLink}}" class="btn">Verify Email Address</a>
        </div>
        <p class="body-text" style="margin-bottom: 0;">
          If you didn't create an account, you can safely ignore this email —
          no account will be activated without verification.
        </p>
        <div class="expiry">
          <span>⏳</span>
          <span>This link will expire in <strong>{{.ExpiryMinutes}} minutes</strong>.</span>
        </div>
        <hr class="divider"/>
        <p class="link-fallback">
          Button not working? Copy and paste this link into your browser:<br/>
          <a href="{{.VerificationLink}}">{{.VerificationLink}}</a>
        </p>
      </div>
      <div class="footer">
        <p>© {{.Year}} {{.AppName}} · All rights reserved.</p>
        <p style="margin-top: 6px;">This is a transactional email — you cannot unsubscribe from it.</p>
      </div>
    </div>
  </div>
</body>
</html>`

// ---------------------------------------------------------------------------
// Example usage — remove or adapt for your actual application
// ---------------------------------------------------------------------------

func CreateTemplate(emailData EmailData) (string, error) {
	tmpl, err := template.New("email").Parse(emailTemplate)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	err = tmpl.Execute(&buf, emailData)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

func SendEmail(cfg *config.Config, to, body string) error {
	auth := smtp.PlainAuth("", cfg.SmtpUser, cfg.SmtpPassword, "smtp.gmail.com")
	
	msg := []byte("To: " + to + "\r\n" +
		"From: " + cfg.SmtpUser + "\r\n" +
		"Subject: Devora - Verify your email\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		body)
	
	addr := "smtp.gmail.com:587"
	
	// Create connection with timeout
	conn, err := net.DialTimeout("tcp", addr, 10*time.Second)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer conn.Close()
	
	// Set read/write deadlines
	conn.SetDeadline(time.Now().Add(30 * time.Second))
	
	// Create SMTP client from connection
	client, err := smtp.NewClient(conn, "smtp.gmail.com")
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()
	
	// Start TLS
	tlsConfig := &tls.Config{ServerName: "smtp.gmail.com"}
	if err = client.StartTLS(tlsConfig); err != nil {
		return fmt.Errorf("failed to start TLS: %w", err)
	}
	
	// Authenticate
	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("authentication failed: %w", err)
	}
	
	// Set sender
	if err = client.Mail(cfg.SmtpUser); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}
	
	// Set recipient
	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}
	
	// Send message
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get data writer: %w", err)
	}
	
	_, err = w.Write(msg)
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}
	
	err = w.Close()
	if err != nil {
		return fmt.Errorf("failed to close data writer: %w", err)
	}
	
	return client.Quit()
}