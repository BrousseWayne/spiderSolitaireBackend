import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

export default async function sendPasswordRecoveryMail(
  sendTo: string,
  resetLink: string
) {
  const mailerSend = new MailerSend({
    apiKey: process.env.MAIL_API!,
  });

  const sentFrom = new Sender(process.env.SENDER_DOMAIN!, "Spidy Soli");

  const recipients = [new Recipient(sendTo, "Your Client")];

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Password Reset</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
          color: #111827;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          padding: 24px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 16px;
        }
        .paragraph {
          font-size: 16px;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .button {
          display: inline-block;
          background-color: #3b82f6;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
        }
        .footer {
          font-size: 14px;
          color: #6b7280;
          margin-top: 32px;
        }
        .code {
          background-color: #f3f4f6;
          padding: 12px;
          border-radius: 4px;
          font-family: monospace;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Reset your password</div>
        <div class="paragraph">
          You have requested to reset your password. Click the button below to proceed. If you didn't make this request, you can safely ignore this email.
        </div>
        <a href="http://localhost:5173/password-reset?token=${resetLink}" class="button" target="_blank" rel="noopener noreferrer">Reset Password</a>
        <div class="paragraph" style="margin-top: 24px">
          Or copy and paste the following link into your browser:
        </div>
        <div class="code">http://localhost:5173/password-reset?token=${resetLink}</div>
        <div class="footer">This link will expire in 20 minutes.</div>
      </div>
    </body>
  </html>
  `;

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject("Password Reset Request")
    .setHtml(htmlContent)
    .setText(`To reset your password, visit the following link: ${resetLink}`);

  await mailerSend.email.send(emailParams);
}
