/**
 * syncController.js
 *
 * Cho phép admin trigger thủ công từ UI — 2 endpoint:
 *  POST /api/sync/rankings    → dọn Ranking orphan + cũ (nhanh, hàng ngày)
 *  POST /api/sync/deep-clean  → deep clean toàn bộ (chậm hơn, 6 tháng/lần)
 */

const { cleanOrphanRankings, runDeepClean } = require('../services/deepCleanService');
const { cleanOldRankings } = require('../controllers/rankingController');

/**
 * POST /api/sync/rankings
 * Dọn Ranking orphan + Ranking cũ hơn tháng trước.
 */
exports.syncRankings = async (req, res) => {
  try {
    const [orphanReport, oldResult] = await Promise.all([
      cleanOrphanRankings(),
      cleanOldRankings()
    ]);

    return res.status(200).json({
      success: true,
      message: 'Đồng bộ ranking hoàn thành',
      data: {
        orphanCleaned:       orphanReport,
        oldRankingsDeleted:  oldResult?.deletedCount ?? 0
      }
    });
  } catch (error) {
    console.error('[SyncController] syncRankings error:', error.message);
    return res.status(500).json({ success: false, message: 'Đồng bộ thất bại' });
  }
};

/**
 * POST /api/sync/deep-clean
 * Xóa vĩnh viễn Course/Teacher đã xóa > 6 tháng + toàn bộ orphan.
 */
exports.deepClean = async (req, res) => {
  try {
    const result = await runDeepClean();

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.success ? 'Deep clean hoàn thành' : 'Deep clean thất bại',
      data: result.report
    });
  } catch (error) {
    console.error('[SyncController] deepClean error:', error.message);
    return res.status(500).json({ success: false, message: 'Deep clean thất bại' });
  }
};
