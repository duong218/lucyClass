const StaffAccount = require('../models/StaffAccount');
const logAdminAction = require('../utils/logAdminAction');
const { cleanInput } = require('../utils/sanitize');

// GET /api/staff  —  lấy danh sách tất cả staff (có thể filter theo role)
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role && ['teacher', 'marketing'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    const staff = await StaffAccount.find(filter)
      .select('-password -refreshTokens -activeSessionId -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// GET /api/staff/:id
exports.getById = async (req, res) => {
  try {
    const staff = await StaffAccount.findById(req.params.id)
      .select('-password -refreshTokens -activeSessionId -resetPasswordToken -resetPasswordExpire');
    if (!staff) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// POST /api/staff  —  admin tạo tài khoản staff mới
exports.create = async (req, res) => {
  try {
    const { role, displayName, phone, courseIds } = req.body;

    if (!['teacher', 'marketing'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
    }

    const username = await StaffAccount.generateUniqueUsername();
    const plainPassword = StaffAccount.generateRandomPassword();

    const staffData = {
      username,
      password: plainPassword,
      role,
      displayName: displayName ? cleanInput(String(displayName).trim()) : '',
      phone: phone ? String(phone).trim() : '',
      email: '',
      courseIds: role === 'teacher' && courseIds ? courseIds : []
    };

    const staff = await StaffAccount.create(staffData);

    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'CREATE_STAFF',
      targetType: 'staff',
      targetId: staff._id,
      description: `Created ${role} account: ${username}`,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: {
        _id: staff._id,
        username: staff.username,
        role: staff.role,
        displayName: staff.displayName,
        email: staff.email,
        createdAt: staff.createdAt
      },
      initialPassword: plainPassword
    });
  } catch (err) {
    console.error('[StaffCreate]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản' });
  }
};

// PUT /api/staff/:id  —  admin cập nhật thông tin
exports.update = async (req, res) => {
  try {
    const { displayName, email, phone, courseIds, isActive } = req.body;
    const updateData = {};

    if (displayName !== undefined) {
      updateData.displayName = cleanInput(String(displayName).trim());
    }
    if (email !== undefined) {
      updateData.email = String(email).trim().toLowerCase();
    }
    if (phone !== undefined) {
      updateData.phone = String(phone).trim();
    }
    if (courseIds !== undefined) {
      updateData.courseIds = courseIds;
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const staff = await StaffAccount.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -activeSessionId');

    if (!staff) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'UPDATE_STAFF',
      targetType: 'staff',
      targetId: staff._id,
      description: `Updated staff: ${staff.username}`,
      req
    });

    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
  }
};

// PUT /api/staff/:id/reset-password  —  admin đặt lại mật khẩu
exports.resetPasswordByAdmin = async (req, res) => {
  try {
    const staff = await StaffAccount.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const newPassword = StaffAccount.generateRandomPassword();
    staff.password = newPassword;
    staff.refreshTokens = [];
    staff.activeSessionId = undefined;
    await staff.save();

    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'RESET_STAFF_PASSWORD',
      targetType: 'staff',
      targetId: staff._id,
      description: `Admin reset password for: ${staff.username}`,
      req
    });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công',
      newPassword
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// DELETE /api/staff/:id  —  vô hiệu hoá tài khoản
exports.remove = async (req, res) => {
  try {
    const staff = await StaffAccount.findByIdAndUpdate(
      req.params.id,
      { isActive: false, refreshTokens: [], activeSessionId: undefined },
      { new: true }
    );
    if (!staff) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'DEACTIVATE_STAFF',
      targetType: 'staff',
      targetId: staff._id,
      description: `Deactivated staff: ${staff.username}`,
      req
    });

    res.json({ success: true, message: 'Tài khoản đã bị vô hiệu hoá' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};


// GET /api/me/profile  --  staff tu xem thong tin + danh sach lop phu trach
exports.getMyProfile = async (req, res) => {
  try {
    const Registration = require('../models/Registration');
    const Teacher      = require('../models/Teacher');
    const Course       = require('../models/Course');

    const staff = await StaffAccount.findById(req.user.id)
      .select('-password -refreshTokens -activeSessionId -resetPasswordToken -resetPasswordExpire')
      .lean();

    if (!staff) return res.status(404).json({ success: false, message: 'Khong tim thay' });

    // Role teacher: tim lop qua Teacher.staffAccountId
    // Course.teacher / additionalTeachers ref den Teacher model.
    // Teacher.staffAccountId la cau noi duy nhat den StaffAccount.
    // StaffAccount.courseIds khong duoc ghi khi admin gan GV vao khoa hoc.
    if (staff.role === 'teacher') {
      // 1. Tim Teacher document lien ket voi tai khoan nay
      const teacherDoc = await Teacher.findOne({
        staffAccountId: req.user.id,
        isDeleted: { $ne: true }
      }).lean();

      let courses = [];
      if (teacherDoc) {
        // 2. Tim tat ca Course ma giao vien nay phu trach (chinh hoac phu)
        courses = await Course.find({
          isDeleted: { $ne: true },
          $or: [
            { teacher: teacherDoc._id },
            { additionalTeachers: teacherDoc._id }
          ]
        })
          .select('name ageGroup duration classSize isActive')
          .lean();
      }

      // 3. Tinh activeStudentCount cho tung lop
      if (courses.length > 0) {
        const courseIdList = courses.map(c => c._id);
        const counts = await Registration.aggregate([
          { $match: { courseId: { $in: courseIdList }, status: 'registered', isActive: true } },
          { $group: { _id: '$courseId', count: { $sum: 1 } } }
        ]);
        const countMap = counts.reduce((acc, curr) => {
          acc[curr._id.toString()] = curr.count;
          return acc;
        }, {});
        courses = courses.map(c => ({
          ...c,
          activeStudentCount: countMap[c._id.toString()] || 0
        }));
      }

      return res.json({ success: true, data: { ...staff, courseIds: courses } });
    }

    // Marketing hoac role khac
    res.json({ success: true, data: { ...staff, courseIds: [] } });
  } catch (err) {
    console.error('[getMyProfile]', err);
    res.status(500).json({ success: false, message: 'Loi he thong' });
  }
};
