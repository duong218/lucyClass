const { google } = require('googleapis');
const crypto = require('crypto');
const oauth2Client = require('../config/google');
const GoogleToken = require('../models/GoogleToken');
const archiver = require('archiver');
const Admin = require('../models/Admin');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');

/* (1) redirectToGoogle (trước khi chatgpt sửa lúc 4:12 24/03)
exports.redirectToGoogle = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent',
  });
  res.redirect(url);
};
*/

//(1) redirectToGoogle (sau khi được chatgpt sửa vào 4:13 24/03)
exports.redirectToGoogle = (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');

  res.cookie('google_oauth_state', state, {
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    state
  });

  //res.redirect(url);
  res.json({ url }); //chatgpt sửa 4:41 24/03
};

// (2) handleGoogleCallback
exports.handleGoogleCallback = async (req, res) => {
  //const { code } = req.query;
  const { code, state } = req.query; //chatgpt đã sửa 4:14 24/
  const storedState = req.signedCookies?.google_oauth_state; //chatgpt đã thêm lúc 4:15 24/03
  const DASHBOARD_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`;

  if (!code) {
    console.error('Google Callback Error: No code received');
    return res.redirect(`${DASHBOARD_URL}?google=error&message=no_code`);
  }

  if (!state || !storedState || state !== storedState) {
    console.error('[OAuth] Invalid state detected!');
    return res.redirect(`${DASHBOARD_URL}?google=error&message=invalid_state`);
  } //chatgpt đã thêm lúc 4:15 24/

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens) {
      throw new Error('Failed to retrieve tokens from Google');
    }

    // Save tokens in MongoDB (upsert so we only have one set of credentials)
    await GoogleToken.findOneAndUpdate({},
      {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || existing?.refresh_token, // 🔥 giữ token cũ
        expiry_date: tokens.expiry_date,
        scope: tokens.scope,
        token_type: tokens.token_type,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      });

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || existing?.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    // Success redirect
    res.clearCookie('google_oauth_state'); //chatgpt đã thêm lúc 4:16 24/
    res.redirect(`${DASHBOARD_URL}?google=success`);
  } catch (error) {
    console.error('Google OAuth Token Exchange Error:', error.message);
    res.redirect(`${DASHBOARD_URL}?google=error&message=${encodeURIComponent(error.message)}`);
  }
};

const fs = require('fs');
const path = require('path');

const backupService = require('../services/backup.service');

// (3) backupToDrive
exports.backupToDrive = async (req, res, next) => {
  try {
    const result = await backupService.runBackup({ uploadToDrive: true });

    // Audit Log
    try {
      await AuditLog.create({
        adminId: req.user?.id || req.user?._id,
        adminName: req.user?.username || 'Admin',
        action: 'BACKUP_SUCCESS',
        description: `Successfully backed up to Google Drive: ${result.fileName}`,
        ipAddress: req.ip
      });
    } catch (auditError) {
      console.error('Audit log failed:', auditError.message);
    }

    res.json({
      success: true,
      fileName: result.fileName,
      message: 'Backup thành công (ZIP)',
      fileId: result.driveFileId
    });
  } catch (error) {
    console.error('Backup error:', error.response?.data || error.message);

    // Check for expired/invalid token
    if (
      error.message === 'GOOGLE_TOKEN_EXPIRED' ||
      error.message.includes('Google Drive account not connected') ||
      error.code === 401
    ) {
      return res.status(401).json({
        success: false,
        message: 'Google token expired, please reconnect'
      });
    }

    next(error);
  }
};


