"""SMTP email. With SMTP_HOST unset it only logs that a message would be sent."""

import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)

# Only filled when SMTP_HOST is unset (tests, laptop), so production never retains bodies.
outbox: list[dict[str, str]] = []


def send_email(to: str, subject: str, body: str) -> None:
    host = os.getenv("SMTP_HOST", "").strip()
    if not host:
        outbox.append({"to": to, "subject": subject, "body": body})
        logger.info("SMTP_HOST unset; would send an email with subject %r", subject)
        return
    try:
        msg = EmailMessage()
        msg["From"] = os.getenv("MAIL_FROM", "no-reply@localhost")
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=10) as smtp:
            user = os.getenv("SMTP_USER", "")
            if user:
                smtp.starttls()
                smtp.login(user, os.getenv("SMTP_PASSWORD", ""))
            smtp.send_message(msg)
    except Exception:
        logger.exception("Failed to send email with subject %r", subject)
