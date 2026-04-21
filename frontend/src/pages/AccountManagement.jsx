import { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmModal from '../components/common/ConfirmModal';
import PrimaryButton from '../components/common/PrimaryButton';
import { showToast } from '../utils/toastUtils';

// ─── Helper: badge màu theo role ─────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = {
    teacher:   { label: 'Giáo viên',  cls: 'bg-emerald-100 text-emerald-700' },
    marketing: { label: 'Marketing',  cls: 'bg-violet-100  text-violet-700'  },
  };
  const { label, cls } = map[role] || { label: role, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>;
};

// ─── Helper: badge trạng thái ────────────────────────────────────────────────
const StatusBadge = ({ isActive }) =>
  isActive
    ? <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">● Hoạt động</span>
    : <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-red-100   text-red-600">● Vô hiệu</span>;

// ─── Modal: hiển thị tài khoản + mật khẩu mới tạo / reset ───────────────────
const CredentialModal = ({ data, onClose }) => {
  const [copied, setCopied] = useState('');
  if (!data) return null;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-7 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🔐</span>
          </div>
          <h3 className="text-xl font-black text-gray-800">
            {data.isReset ? 'Mật khẩu mới' : 'Tài khoản vừa tạo'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Sao chép và gửi thông tin này cho nhân viên. <br />
            <span className="text-red-500 font-semibold">Mật khẩu chỉ hiển thị 1 lần!</span>
          </p>
        </div>

        {/* Username */}
        <div className="mb-3">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
            Tên đăng nhập
          </label>
          <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3">
            <span className="flex-1 font-mono font-bold text-gray-800 text-sm">{data.username}</span>
            <button
              onClick={() => copy(data.username, 'user')}
              className="text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors shrink-0"
            >
              {copied === 'user' ? '✅ Đã copy' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="mb-5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
            Mật khẩu {data.isReset ? 'mới' : 'ban đầu'}
          </label>
          <div className="flex items-center gap-2 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3">
            <span className="flex-1 font-mono font-bold text-amber-800 text-sm tracking-widest">{data.password}</span>
            <button
              onClick={() => copy(data.password, 'pass')}
              className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors shrink-0"
            >
              {copied === 'pass' ? '✅ Đã copy' : '📋 Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-base hover:bg-blue-700 transition-all active:scale-95"
        >
          Đã lưu thông tin, đóng lại
        </button>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AccountManagement = () => {
  const [accounts, setAccounts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [showForm, setShowForm]           = useState(false);
  const [editingAcc, setEditingAcc]       = useState(null);   // null = tạo mới
  const [credModal, setCredModal]         = useState(null);   // { username, password, isReset }
  const [confirmModal, setConfirmModal]   = useState({ isOpen: false, id: null, action: '' });
  const [isSubmitting, setIsSubmitting]   = useState(false);

  // Form state
  const emptyForm = { role: 'teacher', displayName: '', email: '', phone: '', isActive: true };
  const [formData, setFormData]   = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      setAccounts(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      showToast.error('Không tải được danh sách tài khoản 😢');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = accounts.filter(acc => {
    const matchSearch =
      !search ||
      acc.username.toLowerCase().includes(search.toLowerCase()) ||
      (acc.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (acc.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole   === 'all' || acc.role   === filterRole;
    const matchStatus = filterStatus === 'all' || String(acc.isActive) === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  // ── Open add / edit form ───────────────────────────────────────────────────
  const openAdd = () => {
    setEditingAcc(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (acc) => {
    setEditingAcc(acc);
    setFormData({
      role:        acc.role,
      displayName: acc.displayName || '',
      email:       acc.email       || '',
      phone:       acc.phone       || '',
      isActive:    acc.isActive,
    });
    setFormErrors({});
    setShowForm(true);
  };

  // ── Validate form ──────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!['teacher', 'marketing'].includes(formData.role)) {
      errs.role = 'Chọn role hợp lệ';
    }
    if (formData.displayName && formData.displayName.length > 60) {
      errs.displayName = 'Tối đa 60 ký tự';
    }
    if (formData.email) {
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.test(formData.email)) errs.email = 'Email không hợp lệ';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit (tạo mới / cập nhật) ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (editingAcc) {
        // Cập nhật thông tin
        await api.put(`/staff/${editingAcc._id}`, {
          displayName: formData.displayName,
          email:       formData.email,
          phone:       formData.phone,
          isActive:    formData.isActive,
        });
        showToast.success('Cập nhật tài khoản thành công! 🎉');
        setShowForm(false);
        fetchAccounts();
      } else {
        // Tạo mới → nhận lại initialPassword
        const res = await api.post('/staff', {
          role:        formData.role,
          displayName: formData.displayName,
          phone:       formData.phone,
        });
        setShowForm(false);
        fetchAccounts();
        // Hiện modal credential ngay
        setCredModal({
          username: res.data.data.username,
          password: res.data.initialPassword,
          isReset:  false,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      showToast.error(`Lỗi: ${msg} 🛠️`);
      setFormErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset password ─────────────────────────────────────────────────────────
  const handleResetPassword = (acc) => {
    setConfirmModal({ isOpen: true, id: acc._id, action: 'reset', accName: acc.displayName || acc.username });
  };

  const confirmResetPassword = async () => {
    try {
      const res = await api.put(`/staff/${confirmModal.id}/reset-password`);
      const acc = accounts.find(a => a._id === confirmModal.id);
      setCredModal({
        username: acc?.username || '',
        password: res.data.newPassword,
        isReset:  true,
      });
      showToast.success('Đã đặt lại mật khẩu thành công! 🔐');
    } catch (err) {
      showToast.error('Đặt lại mật khẩu thất bại 😢');
    } finally {
      setConfirmModal({ isOpen: false, id: null, action: '' });
    }
  };

  // ── Deactivate / Activate ──────────────────────────────────────────────────
  const handleToggleStatus = (acc) => {
    setConfirmModal({
      isOpen:  true,
      id:      acc._id,
      action:  acc.isActive ? 'deactivate' : 'activate',
      accName: acc.displayName || acc.username,
      isActive: acc.isActive,
    });
  };

  const confirmToggleStatus = async () => {
    try {
      if (confirmModal.action === 'deactivate') {
        await api.delete(`/staff/${confirmModal.id}`);
        showToast.success('Đã vô hiệu hoá tài khoản ✅');
      } else {
        await api.put(`/staff/${confirmModal.id}`, { isActive: true });
        showToast.success('Đã kích hoạt lại tài khoản ✅');
      }
      fetchAccounts();
    } catch (err) {
      showToast.error('Thao tác thất bại. Vui lòng thử lại 😢');
    } finally {
      setConfirmModal({ isOpen: false, id: null, action: '' });
    }
  };

  const handleConfirm = () => {
    if (confirmModal.action === 'reset')      return confirmResetPassword();
    if (confirmModal.action === 'deactivate') return confirmToggleStatus();
    if (confirmModal.action === 'activate')   return confirmToggleStatus();
  };

  const confirmMessages = {
    reset:      `Đặt lại mật khẩu cho "${confirmModal.accName}"? Mật khẩu mới sẽ được tạo ngẫu nhiên và tài khoản sẽ bị đăng xuất.`,
    deactivate: `Vô hiệu hoá tài khoản "${confirmModal.accName}"? Tài khoản này sẽ không thể đăng nhập cho đến khi được kích hoạt lại.`,
    activate:   `Kích hoạt lại tài khoản "${confirmModal.accName}"?`,
  };
  const confirmTitles = {
    reset:      '🔑 Đặt lại mật khẩu',
    deactivate: '🚫 Vô hiệu hoá tài khoản',
    activate:   '✅ Kích hoạt tài khoản',
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalTeacher   = accounts.filter(a => a.role === 'teacher').length;
  const totalMarketing = accounts.filter(a => a.role === 'marketing').length;
  const totalActive    = accounts.filter(a => a.isActive).length;

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* Tiêu đề */}
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">👥 Quản lý tài khoản nhân viên</h2>
        <p className="text-sm text-gray-400 mt-0.5">Tạo và quản lý tài khoản đăng nhập cho giáo viên và nhân viên marketing</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">👩‍🏫</div>
          <div>
            <p className="text-2xl font-black text-gray-800">{totalTeacher}</p>
            <p className="text-xs text-gray-400 font-semibold">Giáo viên</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl">📢</div>
          <div>
            <p className="text-2xl font-black text-gray-800">{totalMarketing}</p>
            <p className="text-xs text-gray-400 font-semibold">Marketing</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">✅</div>
          <div>
            <p className="text-2xl font-black text-gray-800">{totalActive}</p>
            <p className="text-xs text-gray-400 font-semibold">Đang hoạt động</p>
          </div>
        </div>
      </div>

      {/* Toolbar: search + filter + add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, username, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm transition-colors"
          />
        </div>
        <select
          value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm font-semibold text-gray-600 bg-white"
        >
          <option value="all">Tất cả role</option>
          <option value="teacher">Giáo viên</option>
          <option value="marketing">Marketing</option>
        </select>
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm font-semibold text-gray-600 bg-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Vô hiệu</option>
        </select>
        <PrimaryButton onClick={openAdd} variant="primary">
          ➕ Tạo tài khoản
        </PrimaryButton>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Tài khoản</th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">SĐT</th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Đang tải...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400 italic">
                    {accounts.length === 0 ? 'Chưa có tài khoản nhân viên nào' : 'Không tìm thấy kết quả'}
                  </td>
                </tr>
              ) : filtered.map(acc => (
                <tr key={acc._id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Tên + username */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 ${acc.role === 'teacher' ? 'bg-emerald-500' : 'bg-violet-500'}`}>
                        {(acc.displayName || acc.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">
                          {acc.displayName || <span className="text-gray-400 italic">Chưa đặt tên</span>}
                        </p>
                        <p className="text-xs font-mono text-gray-400">{acc.username}</p>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <RoleBadge role={acc.role} />
                  </td>
                  {/* Email */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    {acc.email
                      ? <span className="text-gray-600 text-xs">{acc.email}</span>
                      : <span className="text-gray-300 text-xs italic">Chưa có</span>}
                  </td>
                  {/* SĐT */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    {acc.phone
                      ? <span className="text-gray-600 text-xs">{acc.phone}</span>
                      : <span className="text-gray-300 text-xs italic">—</span>}
                  </td>
                  {/* Trạng thái */}
                  <td className="px-4 py-3.5">
                    <StatusBadge isActive={acc.isActive} />
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => openEdit(acc)}
                        className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-100 transition-all hover:-translate-y-0.5"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleResetPassword(acc)}
                        className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100 border border-amber-100 transition-all hover:-translate-y-0.5"
                      >
                        🔑 Đổi pass
                      </button>
                      <button
                        onClick={() => handleToggleStatus(acc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:-translate-y-0.5 ${
                          acc.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-100'
                        }`}
                      >
                        {acc.isActive ? '🚫 Khoá' : '✅ Mở'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-400 font-semibold">
              Hiển thị {filtered.length} / {accounts.length} tài khoản
            </p>
          </div>
        )}
      </div>

      {/* ── Modal: tạo mới / chỉnh sửa ───────────────────────────────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-gray-800 mb-5">
              {editingAcc ? '✏️ Chỉnh sửa tài khoản' : '➕ Tạo tài khoản nhân viên'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Role — chỉ cho chọn khi tạo mới */}
              {!editingAcc && (
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    Vai trò *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'teacher',   label: '👩‍🏫 Giáo viên',  desc: 'Quản lý lớp học, điểm danh' },
                      { value: 'marketing', label: '📢 Marketing',   desc: 'Tạo & quản lý thông báo'     },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: opt.value })}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${
                          formData.role === opt.value
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-black text-sm text-gray-800">{opt.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  {formErrors.role && <p className="text-red-500 text-xs mt-1 font-semibold">{formErrors.role}</p>}
                </div>
              )}

              {/* Tên hiển thị */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value.slice(0, 60) })}
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${
                    formErrors.displayName ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'
                  }`}
                  placeholder="Nguyễn Thị Lan"
                />
                {formErrors.displayName && <p className="text-red-500 text-xs mt-1 font-semibold">{formErrors.displayName}</p>}
              </div>

              {/* Email — chỉ hiện khi edit (lúc tạo admin chưa biết email) */}
              {editingAcc && (
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${
                      formErrors.email ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'
                    }`}
                    placeholder="email@example.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">Dùng để nhận link quên mật khẩu</p>
                  {formErrors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{formErrors.email}</p>}
                </div>
              )}

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm transition-colors"
                  placeholder="0901234567"
                />
              </div>

              {/* isActive — chỉ hiện khi edit */}
              {editingAcc && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-700">Trạng thái tài khoản</p>
                    <p className="text-xs text-gray-400">Tắt để chặn đăng nhập tạm thời</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )}

              {/* Info box khi tạo mới */}
              {!editingAcc && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                    💡 Hệ thống sẽ tự động tạo tên đăng nhập (<span className="font-mono">LCxxxxxxxx</span>) và mật khẩu ngẫu nhiên. Thông tin này sẽ hiện sau khi tạo thành công.
                  </p>
                </div>
              )}

              {formErrors.submit && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-red-600 text-xs font-bold">⚠️ {formErrors.submit}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <PrimaryButton type="submit" isLoading={isSubmitting} variant="success" className="flex-1">
                  {editingAcc ? '💾 Lưu thay đổi' : '➕ Tạo tài khoản'}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold hover:bg-gray-200 text-sm transition-all"
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal credential (tạo mới / reset pass) */}
      <CredentialModal data={credModal} onClose={() => setCredModal(null)} />

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, action: '' })}
        onConfirm={handleConfirm}
        title={confirmTitles[confirmModal.action] || 'Xác nhận'}
        message={confirmMessages[confirmModal.action] || ''}
      />
    </div>
  );
};

export default AccountManagement;
