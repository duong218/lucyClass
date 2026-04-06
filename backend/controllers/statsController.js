const Registration = require('../models/Registration');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Feedback = require('../models/Feedback');

// Helper for date boundaries
const getDateBoundaries = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { today, weekAgo, thirtyDaysAgo };
};

// GET /api/stats
exports.getStats = async (req, res) => {
  try {
    const { today, weekAgo, thirtyDaysAgo } = getDateBoundaries();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalRegistrations,
      activeCourses,
      totalTeachers,
      totalFeedback,
      todayCount,
      yesterdayCount,
      weekCount,
      regByCourse,
      dailyTrend,
      ageDistribution
    ] = await Promise.all([
      Registration.countDocuments().catch(() => 0),
      Course.countDocuments({ isActive: true }).catch(() => 0),
      Teacher.countDocuments().catch(() => 0),
      Feedback.countDocuments({ isDeleted: { $ne: true } }).catch(() => 0),
      Registration.countDocuments({ createdAt: { $gte: today } }).catch(() => 0),
      Registration.countDocuments({ createdAt: { $gte: yesterday, $lt: today } }).catch(() => 0),
      Registration.countDocuments({ createdAt: { $gte: weekAgo } }).catch(() => 0),
      
      // Registrations by course
      Registration.aggregate([
        { $match: { courseId: { $ne: null } } },
        { $group: { _id: '$courseId', total: { $sum: 1 } } },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, total: 1, courseName: { $ifNull: ['$course.name', 'Unknown'] } } },
        { $sort: { total: -1 } }
      ]).catch(() => []),

      // Daily trend
      Registration.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).catch(() => []),

      // Age distribution
      Registration.aggregate([
        { $match: { childAge: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ['$childAge', 3] }, then: '0-3' },
                  { case: { $lte: ['$childAge', 5] }, then: '4-5' },
                  { case: { $lte: ['$childAge', 7] }, then: '6-7' },
                  { case: { $lte: ['$childAge', 10] }, then: '8-10' },
                ],
                default: '10+'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).catch(() => [])
    ]);

    // Calculate Growth %
    const growth = yesterdayCount === 0 
      ? (todayCount > 0 ? 100 : 0) 
      : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);

    res.json({
      success: true,
      data: {
        totalRegistrations,
        activeCourses,
        totalTeachers,
        totalFeedback,
        todayCount,
        yesterdayCount,
        growth,
        weekCount,
        regByCourse,
        dailyTrend,
        ageDistribution
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({
      success: false,
      message: 'Failed to fully load statistics',
      data: {
        totalRegistrations: 0,
        activeCourses: 0,
        totalTeachers: 0,
        totalFeedback: 0,
        todayCount: 0,
        yesterdayCount: 0,
        growth: 0,
        weekCount: 0,
        regByCourse: [],
        dailyTrend: [],
        ageDistribution: []
      }
    });
  }
};

// GET /api/stats/dashboard
exports.getDashboardData = async (req, res) => {
  try {
    const { today, weekAgo, thirtyDaysAgo } = getDateBoundaries();

    const [
      totalRegistrations,
      activeCourses,
      totalTeachers,
      totalFeedback,
      regByCourse,
      dailyTrend,
      ageDistribution,
      recentRegistrations,
      recentFeedback
    ] = await Promise.all([
      Registration.countDocuments().catch(() => 0),
      Course.countDocuments({ isActive: true }).catch(() => 0),
      Teacher.countDocuments().catch(() => 0),
      Feedback.countDocuments({ isDeleted: { $ne: true } }).catch(() => 0),
      
      // Aggregations
      Registration.aggregate([
        { $match: { courseId: { $ne: null } } },
        { $group: { _id: '$courseId', total: { $sum: 1 } } },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, total: 1, courseName: { $ifNull: ['$course.name', 'Unknown'] } } },
        { $sort: { total: -1 } }
      ]).catch(() => []),

      Registration.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).catch(() => []),

      Registration.aggregate([
        { $match: { childAge: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ['$childAge', 3] }, then: '0-3' },
                  { case: { $lte: ['$childAge', 5] }, then: '4-5' },
                  { case: { $lte: ['$childAge', 7] }, then: '6-7' },
                  { case: { $lte: ['$childAge', 10] }, then: '8-10' },
                ],
                default: '10+'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).catch(() => []),

      // Lists
      Registration.find()
        .populate('courseId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .catch(() => []),

      Feedback.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(2)
        .catch(() => [])
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalRegistrations,
          activeCourses,
          totalTeachers,
          totalFeedback,
          regByCourse,
          dailyTrend,
          ageDistribution
        },
        recentRegistrations,
        recentFeedback
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.json({
      success: false,
      message: 'Failed to load dashboard',
      data: {
        stats: { totalRegistrations: 0, activeCourses: 0, totalTeachers: 0, totalFeedback: 0, regByCourse: [], dailyTrend: [], ageDistribution: [] },
        recentRegistrations: [],
        recentFeedback: []
      }
    });
  }
};
