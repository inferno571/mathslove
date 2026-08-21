import 'server-only';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'MathsLove <onboarding@resend.dev>';

export async function sendOTPEmail(email: string, code: string) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${code} is your MathsLove verification code`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0; padding:0; background:#f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:white; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1b2b5e, #2b3d7b); padding: 32px; text-align:center;">
                    <h1 style="color:white; margin:0; font-size:24px; font-weight:800; letter-spacing:-0.02em;">
                      Maths<span style="color:#f59e0b;">Love</span>
                    </h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <h2 style="color:#1b2b5e; margin:0 0 8px; font-size:20px;">Verify your login</h2>
                    <p style="color:#64748b; margin:0 0 32px; font-size:15px; line-height:1.6;">
                      Enter the following code to complete your sign-in. This code expires in 5 minutes.
                    </p>
                    <!-- OTP Code -->
                    <div style="background:#f1f5f9; border-radius:12px; padding:24px; text-align:center; margin-bottom:32px;">
                      <span style="font-family:'Courier New',monospace; font-size:36px; font-weight:800; letter-spacing:8px; color:#1b2b5e;">
                        ${code}
                      </span>
                    </div>
                    <p style="color:#94a3b8; margin:0; font-size:13px; line-height:1.5;">
                      If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; border-top:1px solid #f1f5f9; text-align:center;">
                    <p style="color:#94a3b8; margin:0; font-size:12px;">
                      &copy; ${new Date().getFullYear()} MathsLove &mdash; Math IQ Assessment
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Failed to send verification email.');
  }
}
