import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import get_settings

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, otp_code: str, business_name: str | None = None, action_link: str | None = None) -> bool:
    """
    Sends a verification code email to the specified recipient.
    Includes the code for on-screen entry, plus an optional 1-click confirmation link.
    Delivers directly via Gmail SMTP.
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

    link_text = f"\n\nOr click here to confirm automatically:\n{action_link}" if action_link else ""
    plain_text = (
        f"Welcome to MarketPilot AI!\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code will expire in 15 minutes.{link_text}\n\n"
        f"If you did not request this verification code, please ignore this message.\n\n"
        f"- The MarketPilot AI Team"
    )

    confirm_btn_html = f"""
          <div style="text-align: center; margin: 24px 0;">
            <a href="{action_link}" style="display: inline-block; background-color: #165823; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 700;">
              Confirm Email Automatically ➔
            </a>
          </div>
    """ if action_link else ""

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
            Please use the confirmation code below to verify your email address:
          </p>
          <div class="otp-container">
            <div class="otp-box">{otp_code}</div>
            <div class="expiry">Valid for 15 minutes. Enter this code on the verification screen.</div>
          </div>
          {confirm_btn_html}
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


def send_verification_link_email(to_email: str, action_link: str, business_name: str | None = None) -> bool:
    """
    Sends an email containing the Supabase verification link to activate the user's workspace.
    Delivers directly via Gmail SMTP / configured SMTP server.
    """
    settings = get_settings()

    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        logger.info(
            "SMTP credentials not configured; verification link email skipped. "
            "Link generated for email: %s",
            to_email,
        )
        return False

    brand = business_name or "MarketPilot AI"
    from_addr = settings.smtp_from or settings.smtp_user

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your email to activate MarketPilot AI"
    msg["From"] = f"MarketPilot AI <{from_addr}>"
    msg["To"] = to_email

    plain_text = (
        f"Welcome to MarketPilot AI!\n\n"
        f"Please verify your email address to activate your workspace for {brand}:\n\n"
        f"{action_link}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"- The MarketPilot AI Team"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your email</title>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }}
        .wrapper {{ width: 100%; max-width: 540px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ background-color: #165823; padding: 28px 24px; text-align: center; }}
        .header h1 {{ color: #ffffff; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px; }}
        .content {{ padding: 32px 28px; }}
        .greeting {{ font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }}
        .text {{ font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }}
        .btn-container {{ text-align: center; margin: 32px 0; }}
        .btn {{ display: inline-block; background-color: #165823; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 2px 4px rgba(22, 88, 35, 0.2); }}
        .link-alt {{ font-size: 12px; color: #64748b; word-break: break-all; margin-top: 20px; }}
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
          <div class="greeting">Welcome to MarketPilot AI!</div>
          <p class="text">
            You are registering your business workspace for <strong>{brand}</strong>.
            Please click the button below to verify your email and activate your workspace:
          </p>
          <div class="btn-container">
            <a href="{action_link}" class="btn" target="_blank">Confirm Email &amp; Launch Workspace ➔</a>
          </div>
          <p class="link-alt">
            Or paste this link into your browser:<br>
            <a href="{action_link}" style="color: #165823;">{action_link}</a>
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
        logger.info("Verification link email sent successfully to %s", to_email)
        return True
    except Exception as exc:
        logger.error("Failed to send verification link email via SMTP: %s", exc)
        return False

