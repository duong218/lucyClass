const nodemailer = require('nodemailer');

// Load environment variables if not already handled in server.js
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Generate standard HTML shell for Lucy Class emails
 */
const getHtmlTemplate = (contentBlocks) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f7f6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      border: 3px solid #FDE047; /* Lucy Class Yellow */
    }
    .header {
      background-color: #C2E0F9; /* Lucy Class Light Blue */
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #FDE047;
    }
    .header h1 {
      margin: 0;
      color: #1e3a8a;
      font-size: 24px;
    }
    .content {
      padding: 30px;
      color: #333333;
      line-height: 1.6;
      font-size: 16px;
    }
    .content h2 {
      color: #4A90D9;
      margin-top: 0;
    }
    .highlight-box {
      background-color: #f8fbff;
      border-left: 4px solid #FDE047;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .highlight-box p {
      margin: 5px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666666;
      border-top: 1px solid #eeeeee;
    }
    .footer strong {
      color: #4A90D9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- Lucy Class Logo placeholder (text based since no explicit logo image URL was given) -->
      <h1>Lucy's Class English Center</h1>
    </div>
    <div class="content">
      ${contentBlocks}
    </div>
    <div class="footer">
      <p>Trân trọng,<br>
      <strong>Đội ngũ Lucy Class!</strong></p>
      <p>Địa chỉ: S1.07 1105 Vinhomes Ocean Park 1<br>
      Fanpage: <a href="https://www.facebook.com/lucysclass" style="color: #4A90D9;">https://www.facebook.com/lucysclass</a></p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send registration confirmation email to parent
 */
exports.sendRegistrationEmail = async (parentEmail, studentName, courseName) => {
  if (!parentEmail || !process.env.EMAIL_USER) return;

  const currentDateTime = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const contentBlocks = `
    <h2>Thân gửi bạn ${studentName},</h2>
    <p>Chúc mừng bạn đã đăng ký thành công khóa học <strong>${courseName}</strong> tại Lucy Class!</p>
    <p>Chúng tôi rất vui mừng được đồng hành cùng bạn trên con đường chinh phục tiếng Anh. Dưới đây là thông tin chi tiết về đơn đăng ký:</p>
    
    <div class="highlight-box">
      <p><strong>1. Thông tin khóa học:</strong></p>
      <ul>
        <li>Tên khóa học: ${courseName}</li>
        <li>Tên học viên: ${studentName}</li>
        <li>Thời gian đăng ký: ${currentDateTime}</li>
      </ul>
    </div>
    
    <div class="highlight-box">
      <p><strong>2. Hỗ trợ học viên:</strong></p>
      <ul>
        <li>Hotline: +84 931768790</li>
        <li>Zalo/Messenger: <a href="https://zalo.me/0931768790" style="color:#4A90D9;">Liên hệ Zalo</a></li>
        <li>Email hỗ trợ: lucyclass2019@gmail.com</li>
      </ul>
    </div>
  `;

  const html = getHtmlTemplate(contentBlocks);

  const mailOptions = {
    from: `"Lucy Class" <${process.env.EMAIL_USER}>`,
    to: parentEmail,
    subject: `Lucy Class - Xác nhận đăng ký thành công khóa học ${courseName}`,
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[DEBUG] Registration email sent to', parentEmail);
  } catch (err) {
    console.error('[ERROR] Failed to send registration email:', err);
  }
};

/**
 * Send internal notification email to admin
 */
exports.sendAdminNotification = async (parentName, phone, studentName, courseName, parentEmail) => {
  if (!process.env.EMAIL_USER) return;

  const contentBlocks = `
    <h2>Thông báo: Có học viên mới đăng ký</h2>
    <p>Hệ thống vừa ghi nhận một lượt đăng ký mới cho khóa học <strong>${courseName}</strong>.</p>
    
    <div class="highlight-box">
      <p><strong>Thông tin đăng ký:</strong></p>
      <ul>
        <li>Phụ huynh: ${parentName}</li>
        <li>SĐT: ${phone}</li>
        <li>Email: ${parentEmail || 'Không cung cấp'}</li>
        <li>Học viên: ${studentName}</li>
        <li>Khóa học: ${courseName}</li>
        <li>Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</li>
      </ul>
    </div>
  `;

  const html = getHtmlTemplate(contentBlocks);

  const mailOptions = {
    from: `"Lucy Class System" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // send to admin
    subject: `[Thông báo Admin] - Đăng ký mới: ${courseName}`,
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[DEBUG] Admin notification email sent.');
  } catch (err) {
    console.error('[ERROR] Failed to send admin notification:', err);
  }
};
