#!/usr/bin/python3

import os
import imaplib
import smtplib
import uuid
import base64
import email
import re
import email.policy
from email.message import EmailMessage
from email.utils import parseaddr, formataddr, make_msgid, parsedate_to_datetime
from src.models.models import InboundEmail, Attachment

class EmailService:
    def __init__(self):
        self.IMAP_SERVER = os.environ.get("IMAP_SERVER")
        self.SMTP_SERVER = os.environ.get("SMTP_SERVER")
        self.EMAIL_USER = os.environ.get("EMAIL_USER")
        self.AUTH_CREDENTIAL = os.environ.get("EMAIL_AUTH_CREDENTIAL")
        self.SMTP_PORT = int(os.environ.get("SMTP_PORT", 465))
        self.INBOUND_FOLDER = os.environ.get("INBOUND_FOLDER", "INBOX")
        self.IMAP_SEARCH_CRITERIA = os.environ.get("IMAP_SEARCH_CRITERIA", "UNSEEN")

        if not all([self.IMAP_SERVER, self.SMTP_SERVER, self.EMAIL_USER, self.AUTH_CREDENTIAL]):
            raise ValueError("Missing some email configuration environment variables.")

    def _login_imap(self) -> imaplib.IMAP4_SSL:
        mail = imaplib.IMAP4_SSL(self.IMAP_SERVER)
        mail.login(self.EMAIL_USER, self.AUTH_CREDENTIAL)
        return mail

    def _login_smtp(self) -> smtplib.SMTP_SSL:
        server = smtplib.SMTP_SSL(self.SMTP_SERVER, self.SMTP_PORT)
        server.login(self.EMAIL_USER, self.AUTH_CREDENTIAL)
        return server

    def pull(self, mark_as_seen: bool = False, max_emails: int = 100) -> list[InboundEmail]:
        mail = None
        inbound_emails: list[InboundEmail] = []

        try:
            mail = self._login_imap()
            mail.select(self.INBOUND_FOLDER)

            search_criteria = self.IMAP_SEARCH_CRITERIA
            _, messages = mail.search(None, search_criteria)
            email_ids = messages[0].split()[:max_emails]

            print(f"Found {len(email_ids)}.")

            for email_id_bytes in email_ids:
                email_id = email_id_bytes.decode()
                _, msg_data = mail.fetch(email_id, '(RFC822)')
                raw_email = msg_data[0][1]

                structured_email = self._parse_raw_email(raw_email, email_id)
                inbound_emails.append(structured_email)

                if mark_as_seen:
                    mail.store(email_id, '+FLAGS', '\\Seen')

        except Exception as e:
            print(f"Error during email pull: {e}")
        finally:
            if mail:
                mail.logout()

        return inbound_emails

    def _strip_quoted_text(self, text: str) -> str:
        if not text:
            return ""
        patterns = [
            r'(?m)^On\s+.*\s+wrote:\s*$',
            r'(?m)^-----Original Message-----',
            r'(?m)^From:.*$',
            r'(?m)^________________________________'
        ]
        cleaned_text = text
        for pattern in patterns:
            parts = re.split(pattern, cleaned_text, flags=re.IGNORECASE | re.MULTILINE)
            if parts:
                cleaned_text = parts[0]
        lines = cleaned_text.splitlines()
        final_lines = []
        for line in lines:
            if line.strip().startswith(">"):
                break
            final_lines.append(line)
        return "\n".join(final_lines).strip()

    def _parse_raw_email(self, raw_email: bytes, imap_uid: str) -> InboundEmail:
        msg = email.message_from_bytes(raw_email, policy=email.policy.default)
        sender_name, sender_email = parseaddr(msg.get('From', ''))
        body_text = "Content not available."
        attachments: list[Attachment] = []

        for part in msg.walk():
            ctype = part.get_content_type()
            cdispo = part.get_content_disposition()

            if cdispo and cdispo.startswith('attachment'):
                filename = part.get_filename()
                if filename:
                    try:
                        file_data = part.get_payload(decode=True)
                        encoded_data = base64.b64encode(file_data).decode('utf-8')
                        attachments.append(Attachment(
                            filename=filename,
                            mime_type=ctype,
                            size_bytes=len(file_data),
                            data=encoded_data
                        ))
                    except Exception as e:
                        print(f"Could not process attachment {filename}: {e}")
                        continue
            elif ctype == 'text/plain' and body_text == "Content not available.":
                try:
                    body_text = part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='replace')
                except Exception:
                    pass

        raw_headers = {k: v for k, v in msg.items()}
        references_list = msg.get('References', '').split()
        received_at = None
        date_header = msg.get('Date')
        if date_header:
            try:
                received_at = parsedate_to_datetime(date_header)
            except Exception:
                pass

        full_body = body_text.strip()
        cleaned_body = self._strip_quoted_text(full_body)

        return InboundEmail(
            unique_id=imap_uid,
            subject=msg.get('Subject', 'No Subject'),
            body_text=cleaned_body,
            full_body_text=full_body,
            sender_email=sender_email,
            sender_name=sender_name if sender_name else None,
            received_at=received_at,
            message_id=msg.get('Message-ID', str(uuid.uuid4())),
            in_reply_to=msg.get('In-Reply-To'),
            references=references_list,
            raw_headers=raw_headers,
            attachments=attachments
        )

    def send(
        self,
        recipient: str,
        subject: str,
        body: str,
        reply_to_message_id: str | None = None,
        references_chain: list[str] | None = None,
        attachments: dict[str, str] | None = None
    ) -> str | None:
        msg = EmailMessage()
        msg['From'] = formataddr((self.EMAIL_USER.split('@')[0], self.EMAIL_USER))
        msg['To'] = recipient
        msg['Subject'] = subject
        msg['Content-Type'] = 'text/plain; charset="utf-8"'
        msg.set_content(body)
        if reply_to_message_id:
            msg['In-Reply-To'] = reply_to_message_id
        if references_chain:
            msg['References'] = ' '.join(references_chain)

        if attachments:
            for filename, data_url in attachments.items():
                try:
                    if ',' in data_url:
                        header, encoded = data_url.split(',', 1)
                        mime_type = header.split(':')[1].split(';')[0]
                        maintype, subtype = mime_type.split('/', 1)
                        file_data = base64.b64decode(encoded)

                        msg.add_attachment(
                            file_data,
                            maintype=maintype,
                            subtype=subtype,
                            filename=filename
                        )
                except Exception as e:
                    print(f"Error attaching file {filename}: {e}")

        new_message_id = make_msgid(idstring=str(uuid.uuid4()))
        msg['Message-ID'] = new_message_id
        try:
            with self._login_smtp() as server:
                server.send_message(msg)
                print(f"Successfully sent email to {recipient} with Message-ID: {new_message_id}")
            return new_message_id
        except Exception as e:
            print(f"Error sending email: {e}")
            return None
