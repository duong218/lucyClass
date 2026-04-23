const staffAttendanceController = require('./staffAttendanceController');

module.exports = {
  toggleAttendance: staffAttendanceController.toggleAttendance,
  getTodayAttendance: staffAttendanceController.getTodayAttendance,
  getAttendanceHistory: staffAttendanceController.getAttendanceHistory,
  getAttendanceByDate: staffAttendanceController.getAttendanceByDate,
  updateAttendance: staffAttendanceController.updateAttendance,
  upsertAttendanceByDate: staffAttendanceController.upsertAttendanceByDate
};
