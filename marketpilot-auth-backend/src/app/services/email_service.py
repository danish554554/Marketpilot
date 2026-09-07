import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import get_settings

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, otp_code: str, business_name: str | None = None) -> bool:
    """
    Sends a 6-digit verification code email to the specified recipient.
    If custom SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASSWORD) are configured in .env,
    delivers directly to the recipient's inbox.
    Otherwise returns False and allows fallback delivery.
    """
    settings = get_settings()

    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        logger.info(
            "SMTP credentials not configured; custom email delivery skipped. "
            "Verification code stored for email: %s",
            to_email,
        )
        return False

    brand = business_name or "MarketPilot AI"
    from_addr = settings.smtp_from or settings.smtp_user

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{otp_code} is your MarketPilot AI verification code"
    msg["From"] = f"MarketPilot AI <{from_addr}>"
    msg["To"] = to_email

    plain_text = (
        f"Welcome to MarketPilot AI!\n\n"
        f"Your 6-digit email verification code is: {otp_code}\n\n"
        f"This code will expire in 15 minutes.\n"
        f"If you did not request this verification code, please ignore this message.\n\n"
        f"- The MarketPilot AI Team"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }}
        .wrapper {{ width: 100%; max-width: 540px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ background-color: #165823; padding: 28px 24px; text-align: center; }}
        .header h1 {{ color: #ffffff; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px; }}
        .content {{ padding: 32px 28px; }}
        .greeting {{ font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }}
        .text {{ font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }}
        .otp-container {{ text-align: center; margin: 28px 0; }}
        .otp-box {{ display: inline-block; background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 14px 28px; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #065f46; font-family: monospace; }}
        .expiry {{ font-size: 12px; color: #64748b; margin-top: 10px; }}
        .divider {{ border-top: 1px solid #e2e8f0; margin: 28px 0 20px 0; }}
        .footer {{ font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; }}
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>◇ MarketPilot AI</h1>
        </div>
        <div class="content">
          <div class="greeting">Verify your email address</div>
          <p class="text">
            Welcome to <strong>MarketPilot AI</strong>! You are registering your business workspace for <strong>{brand}</strong>.
            Please use the 6-digit confirmation code below to verify your email address:
          </p>
          <div class="otp-container">
            <div class="otp-box">{otp_code}</div>
            <div class="expiry">Valid for 15 minutes. Never share this code with anyone.</div>
          </div>
          <p class="text" style="font-size: 13px; margin-bottom: 0;">
            If you did not request this verification, you can safely ignore this email.
          </p>
          <div class="divider"></div>
          <div class="footer">
            &copy; 2026 MarketPilot AI. Autonomous E-commerce Marketing Intelligence.
          </div>
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        if settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
            server.starttls()

        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info("Verification code email sent successfully to %s", to_email)
        return True
    except Exception as exc:
        logger.error("Failed to send verification email via SMTP: %s", exc)
        return False
