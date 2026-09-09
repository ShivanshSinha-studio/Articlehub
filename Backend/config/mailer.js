const nodemailer = require('nodemailer');

const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log(`[mail:dev] ${subject} -> ${to}\n${text}`);
    return { dev: true };
  }

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text
  });
};

const sendVerificationEmail = async ({ to, name, verificationUrl }) => {
  const safeName = name || 'there';
  return sendMail({
    to,
    subject: 'Verify your Article Hub email',
    text: `Hi ${safeName},

Welcome to Article Hub. Please verify your email address using this secure link:
${verificationUrl}

This link expires in 24 hours. If you did not create this account, you can ignore this email.

Article Hub`,
    html: `
      <div style="margin:0;padding:0;background:#f6f4ef;font-family:Inter,Segoe UI,Arial,sans-serif;color:#171412">
        <div style="max-width:620px;margin:0 auto;padding:34px 18px">
          <div style="background:#ffffff;border:1px solid #e7e2da;border-radius:10px;overflow:hidden;box-shadow:0 24px 70px rgba(28,25,23,0.10)">
            <div style="background:#08090d;padding:28px;color:#ffffff">
              <div style="font-size:13px;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;color:#99f6e4">Article Hub</div>
              <h1 style="margin:14px 0 0;font-size:30px;line-height:1.1">Verify your email address</h1>
            </div>
            <div style="padding:30px">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7">Hi ${safeName},</p>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#57534e">
                Welcome to Article Hub. Confirm your email to secure your account and continue with reader or author access.
              </p>
              <a href="${verificationUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:13px 18px;border-radius:7px;text-decoration:none;font-weight:900">
                Verify email
              </a>
              <p style="margin:24px 0 8px;font-size:13px;line-height:1.6;color:#78716c">This link expires in 24 hours. If the button does not work, paste this URL into your browser:</p>
              <p style="word-break:break-all;margin:0;font-size:13px;line-height:1.6;color:#0f766e">${verificationUrl}</p>
            </div>
          </div>
        </div>
      </div>
    `
  });
};

module.exports = { sendVerificationEmail };
