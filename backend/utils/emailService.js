const sgMail = require('@sendgrid/mail');

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("Missing SENDGRID_API_KEY in environment variables");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Standard HTML layout for LucyClass emails
 * Uses <table> layout for Gmail compatibility
 */
const getHtmlTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LucyClass English Center</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e0e0e0;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #4F9CF9; padding: 30px;">
              <img src="https://res.cloudinary.com/dtf9wke7m/image/upload/v1776183996/logo_ahh4ff.png" alt="LucyClass Logo" width="100" style="display: block; margin-bottom: 10px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">LucyClass English Center</h1>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px; color: #333333; line-height: 1.6; font-size: 16px;">
              ${content}
            </td>
          </tr>
          <!-- Support Section -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fbff; border-radius: 8px; padding: 20px; border: 1px solid #eef2f8;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #4F9CF9;">Thông tin hỗ trợ:</p>
                    <p style="margin: 0; font-size: 14px; color: #666666;">📞 Hotline: <strong>+84 931768790</strong></p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #666666;">📧 Email: <a href="mailto:lucyclasspage@gmail.com" style="color: #4F9CF9; text-decoration: none;">lucyclasspage@gmail.com</a></p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #666666;">🌐 Facebook: <a href="https://www.facebook.com/lucysclass" style="color: #4F9CF9; text-decoration: none;">fb.com/lucysclass</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px; background-color: #fcfcfc; border-top: 1px solid #f0f0f0; color: #888888; font-size: 14px;">
              <p style="margin: 0;">Trân trọng,<br><strong style="color: #4F9CF9;">Đội ngũ LucyClass</strong></p>
              <p style="margin: 10px 0 0 0;">S1.07 1105 Vinhomes Ocean Park 1</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Reusable function to send email via SendGrid
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.EMAIL_FROM) {
      console.error('❌ EMAIL_FROM is missing!');
      return;
    }

    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject,
      html,
      text: text || subject
    };

    console.log("📧 Sending email via SendGrid:", { to, subject });

    await sgMail.send(msg);

    console.log("✅ Email sent successfully via SendGrid");
  } catch (error) {
    console.error("❌ SendGrid send error:", error.response?.body || error.message);
    throw error;
  }
};

/**
 * Send registration confirmation email to parent
 */
const sendRegistrationEmail = async (parentEmail, studentName, courseName) => {
  const content = `
    <p style="margin: 0; font-size: 18px;">Xin chào ${studentName || 'bạn'} 👋</p>
    <p style="margin: 15px 0 25px 0;">Chúc mừng bạn đã đăng ký thành công khóa học tại <strong>LucyClass</strong>!</p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5faff; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #FFD93D;">
      <tr>
        <td>
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #333333;">Chi tiết đăng ký:</p>
          <p style="margin: 5px 0; font-size: 15px;">📌 <strong>Tên khóa học:</strong> ${courseName}</p>
          <p style="margin: 5px 0; font-size: 15px;">👤 <strong>Tên học viên:</strong> ${studentName}</p>
          <p style="margin: 5px 0; font-size: 15px;">🕒 <strong>Thời gian đăng ký:</strong> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="mailto:lucyclasspage@gmail.com" style="background-color: #FFD93D; color: #000000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">Liên hệ hỗ trợ</a>
        </td>
      </tr>
    </table>
  `;

  await sendEmail({
    to: parentEmail,
    subject: "LucyClass - Xác nhận đăng ký thành công",
    html: getHtmlTemplate(content),
    text: `Xin chào ${studentName}, bạn đã đăng ký thành công khóa học ${courseName} tại LucyClass.`
  });
};

/**
 * Send internal notification email to admin
 */
const sendAdminNotification = async (parentName, phone, studentName, courseName, parentEmail) => {
  const content = `
    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #4F9CF9;">🛎 Có học viên mới đăng ký!</p>
    <p style="margin: 15px 0;">Hệ thống vừa ghi nhận một lượt đăng ký mới:</p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fbff; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #eef2f8;">
      <tr>
        <td>
          <p style="margin: 5px 0; font-size: 15px;">👤 <strong>Học viên:</strong> ${studentName}</p>
          <p style="margin: 5px 0; font-size: 15px;">📌 <strong>Khóa học:</strong> ${courseName}</p>
          <p style="margin: 5px 0; font-size: 15px;">👨‍👩‍👧 <strong>Phụ huynh:</strong> ${parentName}</p>
          <p style="margin: 5px 0; font-size: 15px;">📞 <strong>SĐT:</strong> ${phone}</p>
          <p style="margin: 5px 0; font-size: 15px;">📧 <strong>Email:</strong> ${parentEmail || 'Không cung cấp'}</p>
        </td>
      </tr>
    </table>
  `;

  await sendEmail({
    to: process.env.EMAIL_FROM,
    subject: `[Admin] Đăng ký mới: ${courseName}`,
    html: getHtmlTemplate(content),
    text: `Có học viên mới đăng ký: ${studentName} - Khóa học: ${courseName}. Phụ huynh: ${parentName}, SĐT: ${phone}.`
  });
};

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendAdminNotification,
  getHtmlTemplate
};
