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

    // Tạo username + password ngẫu nhiên
    const username = await StaffAccount.generateUniqueUsername();
    const plainPassword = StaffAccount.generateRandomPassword();

    const staffData = {
      username,
      password: plainPassword, // sẽ được hash trong pre-save hook
      role,
      displayName: displayName ? cleanInput(String(displayName).trim()) : '',
      phone: phone ? String(phone).trim() : '',
      email: '', // để trống, admin điền sau
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

    // Trả về plain password 1 lần duy nhất để admin copy cho nhân viên
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
      // Plain password chỉ trả về lúc tạo — lưu lại để thông báo cho nhân viên
      initialPassword: plainPassword
    });
  } catch (err) {
    console.error('[StaffCreate]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản' });
  }
};

// PUT /api/staff/:id  —  admin cập nhật thông tin (tên, email, phone, courseIds, isActive)
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

// PUT /api/staff/:id/reset-password  —  admin đặt lại mật khẩu mới cho staff
exports.resetPasswordByAdmin = async (req, res) => {
  try {
    const staff = await StaffAccount.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const newPassword = StaffAccount.generateRandomPassword();
    staff.password = newPassword; // pre-save hook sẽ hash
    // Xoá session hiện tại để bắt đăng nhập lại với pass mới
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
      newPassword // trả về 1 lần để admin thông báo cho nhân viên
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// DELETE /api/staff/:id  —  xoá tài khoản (soft: isActive = false)
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

// GET /api/me/profile  —  staff tự xem thông tin cá nhân của mình
exports.getMyProfile = async (req, res) => {
  try {
    const staff = await StaffAccount.findById(req.user.id)
      .select('-password -refreshTokens -activeSessionId -resetPasswordToken -resetPasswordExpire')
      .populate('courseIds', 'name ageGroup');

    if (!staff) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};