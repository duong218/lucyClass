const Ranking = require('../models/Ranking');
const mongoose = require('mongoose');
const { cleanInput } = require('../utils/sanitize');
const { clearCache } = require('../middlewares/cacheMiddleware');

const getPreviousMonthYear = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (currentMonth === 1) {
    return { month: 12, year: currentYear - 1 };
  }

  return { month: currentMonth - 1, year: currentYear };
};

const isDevelopment = process.env.NODE_ENV !== 'production';
const debugLog = (...args) => {
  if (isDevelopment) {
    console.log('[Ranking]', ...args);
  }
};

const sanitizeOptionalString = (value, maxLen) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return '';
  if (normalized.length > maxLen) return null;
  return normalized;
};

const cleanOldRankings = async () => {
  const { month: keepMonth, year: keepYear } = getPreviousMonthYear();
  const keepKey = keepYear * 100 + keepMonth;

  const result = await Ranking.deleteMany({
    $expr: {
      $lt: [
        {
          $add: [
            { $multiply: ['$year', 100] },
            '$month'
          ]
        },
        keepKey
      ]
    }
  });

  debugLog(`cleanOldRankings deleted ${result.deletedCount || 0} records (keep from ${keepMonth}/${keepYear})`);
  return result;
};

const createOrUpdateRanking = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { studentId, courseId, childName, courseName, stars, title, skill } = req.body;
    const parsedStars = Number(stars);
    const normalizedSkill = sanitizeOptionalString(skill, 120);
    const normalizedTitle = sanitizeOptionalString(title, 120);
    const normalizedChildName = sanitizeOptionalString(childName, 120);
    const normalizedCourseName = sanitizeOptionalString(courseName, 180);

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required and must be a valid ObjectId'
      });
    }

    if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'courseId must be a valid ObjectId'
      });
    }

    if (!Number.isFinite(parsedStars) || parsedStars < 0 || parsedStars > 100) {
      return res.status(400).json({
        success: false,
        message: 'stars is required and must be a number between 0 and 100'
      });
    }

    if (normalizedSkill === null || !normalizedSkill) {
      return res.status(400).json({
        success: false,
        message: 'skill is required and must be a non-empty string'
      });
    }

    if (normalizedTitle === null || !normalizedTitle) {
      return res.status(400).json({
        success: false,
        message: 'title is required and must be a non-empty string'
      });
    }

    if (normalizedChildName === null) {
      return res.status(400).json({
        success: false,
        message: 'childName must be a valid string (max 120 chars)'
      });
    }

    if (normalizedCourseName === null) {
      return res.status(400).json({
        success: false,
        message: 'courseName must be a valid string (max 180 chars)'
      });
    }

    const rankingPayload = {
      studentId,
      courseId,
      childName: cleanInput(normalizedChildName),
      courseName: cleanInput(normalizedCourseName),
      stars: parsedStars,
      title: cleanInput(normalizedTitle),
      skill: cleanInput(normalizedSkill),
      month,
      year
    };

    let ranking;
    try {
      ranking = await Ranking.findOneAndUpdate(
        { studentId, month, year },
        {
          $set: rankingPayload,
          $setOnInsert: { createdAt: now }
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      // Handle upsert race condition under concurrent requests.
      if (error && error.code === 11000) {
        ranking = await Ranking.findOneAndUpdate(
          { studentId, month, year },
          { $set: rankingPayload },
          { new: true, runValidators: true }
        );
      } else {
        throw error;
      }
    }

    // 👈 Xóa cache sau khi tạo/update thành công
    await clearCache('/api/rankings');

    return res.status(201).json({
      success: true,
      data: ranking
    });
  } catch (error) {
    debugLog('createOrUpdateRanking error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create or update ranking'
    });
  }
};

const getTopRankings = async (req, res) => {
  try {
    let month;
    let year;

    if (process.env.NODE_ENV === 'production') {
      ({ month, year } = getPreviousMonthYear());
    } else {
      const now = new Date();
      month = now.getMonth() + 1;
      year = now.getFullYear();
    }

    const rankings = await Ranking.find({ month, year })
      .sort({ stars: -1, createdAt: 1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: rankings
    });
  } catch (error) {
    debugLog('getTopRankings error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch top rankings'
    });
  }
};

module.exports = {
  createOrUpdateRanking,
  getTopRankings,
  cleanOldRankings
};
