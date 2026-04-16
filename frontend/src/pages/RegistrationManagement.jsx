import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showToast } from '../utils/toastUtils';
import ConfirmModal from '../components/common/ConfirmModal';
import api from '../services/api';
import { formatDateTime, getRelativeTime } from '../utils/dateUtils';

const RegistrationManagement = () => {
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const itemsPerPage = 10;

  const fetchStudents = async () => {
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/registrations', { params });
      if (res.data?.success && res.data?.data) {
        let data = res.data.data.registrations || [];
        if (courseFilter) data = data.filter(r => (r.courseId?._id || r.courseId) === courseFilter);
        setRegistrations(Array.isArray(data) ? data : []);
        setTotalRegistrations(res.data.data.total || 0);
        setTotalPages(res.data.data.pages || 1);
      } else {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setRegistrations(data);
        setTotalRegistrations(data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đăng ký:', err);
      setRegistrations([]);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      const data = res.data?.data || res.data || [];
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải danh sách khoá học:', err);
      setCourses([]);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        const statsData = res.data?.data || res.data || {};
        if (statsData.todayCount !== undefined) {
          setTodayCount(statsData.todayCount);
          setWeekCount(statsData.weekCount || 0);
        }
      } catch (err) {
        console.error('Lỗi tải thống kê:', err);
      }
    };
    fetchStats();
    fetchStudents();
  }, [search, statusFilter, courseFilter, currentPage]);

  const paginated = Array.isArray(registrations) ? registrations : [];

  const updateStudentStatus = async (id, status) => {
    setIsUpdating(true);
    const originalRegistrations = [...registrations];
    setRegistrations(prev => prev.map(r => r._id === id ? { ...r, status } : r));
    try {
      await api.put(`/registrations/${id}`, { status });
      showToast.success('Cập nhật trạng thái thành công! 🎉');
      await Promise.all([fetchStudents(), fetchCourses()]);
    } catch (err) {
      setRegistrations(originalRegistrations);
      const msg = err.response?.data?.message || err.message || '';
      if (msg === 'Lớp đã đủ học viên') {
        showToast.error('Không thể thêm: lớp học đã đủ học viên 😢');
      } else {
        showToast.error(msg ? `Cập nhật thất bại: ${msg}` : 'Cập nhật thất bại. Vui lòng thử lại 😢');
      }
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (id) => setConfirmModal({ isOpen: true, id });

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await api.delete(`/registrations/${confirmModal.id}`);
      showToast.success('Đã xoá đăng ký thành công! ✨');
      fetchStudents();
    } catch (err) {
      console.error(err);
      showToast.error('Xoá thất bại. Vui lòng thử lại 😢');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const statusConfig = {
    not_contacted: { label: 'Chưa liên hệ', color: 'bg-red-100 text-red-700 border-red-200' },
    contacted:     { label: 'Đã liên hệ',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
    registered:    { label: 'Đã đăng ký',   color: 'bg-green-100 text-green-700 border-green-200' },
  };

  const getSelectedCourseInfo = () => {
    if (!selected?.courseId?._id) return null;
    return courses.find(c => c._id === selected.courseId._id);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">📋 Quản lý đăng ký</h2>
        <p className="text-sm text-gray-400 mt-0.5">Theo dõi và cập nhật trạng thái các đăng ký học viên</p>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 border-2 border-blue-200 rounded-2xl p-5 flex items-center gap-4">
          <span className="text-3xl">📅</span>
          <div>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Hôm nay</p>
            <p className="text-3xl font-black text-blue-700">{todayCount || 0}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-2 border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
          <span className="text-3xl">📊</span>
          <div>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Tuần này</p>
            <p className="text-3xl font-black text-emerald-700">{weekCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Thanh lọc */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo tên phụ huynh, học sinh hoặc số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm transition-colors"
          />
        </div>
        <select value={courseFilter} onChange={e => { setCourseFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm min-w-[180px] bg-white">
          <option value="">Tất cả khoá học</option>
          {Array.isArray(courses) && courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm min-w-[180px] bg-white">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Phụ huynh', 'Học sinh', 'Tuổi', 'Khoá học', 'Số điện thoại', 'Thời gian', 'Trạng thái', 'Hành động'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(reg => (
                <tr key={reg._id} className="border-b last:border-0 hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                    <span className="font-medium text-gray-800">{reg.parentName}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{reg.childName}</td>
                  <td className="px-4 py-3 text-gray-600">{reg.childAge} tuổi</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold border border-blue-100">
                      {reg.courseId?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{reg.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700 text-xs">{formatDateTime(reg.createdAt)}</span>
                      <span className="text-[10px] text-gray-400">{getRelativeTime(reg.createdAt, t)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusConfig[reg.status]?.color || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {statusConfig[reg.status]?.label || reg.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(reg)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100 border border-blue-100 transition-all">Chi tiết</button>
                      <button onClick={() => handleDeleteClick(reg._id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-100 transition-all">Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan="8" className="text-center py-12 text-gray-400 italic">Không tìm thấy đăng ký nào</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-5 border-t bg-gray-50/50">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white text-sm hover:bg-gray-50 disabled:opacity-30 transition-all font-bold">‹</button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-semibold transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'border bg-white hover:bg-gray-50'}`}>
                    {page}
                  </button>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="text-gray-400">…</span>;
              return null;
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white text-sm hover:bg-gray-50 disabled:opacity-30 transition-all font-bold">›</button>
          </div>
        )}
      </div>

      {/* Modal chi tiết */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all text-lg">✕</button>
            <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
              <span className="p-2 bg-blue-50 rounded-xl text-blue-600">📄</span> Chi tiết đăng ký
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Tên phụ huynh', value: selected.parentName },
                { label: 'Tên học sinh', value: selected.childName },
                { label: 'Tuổi', value: `${selected.childAge} tuổi` },
                { label: 'Số điện thoại', value: selected.phone, highlight: true },
                { label: 'Khoá học', value: selected.courseId?.name || 'N/A', badge: true },
              ].map(({ label, value, highlight, badge }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-semibold text-gray-500">{label}</span>
                  {badge
                    ? <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full font-bold text-xs">{value}</span>
                    : <span className={`font-bold ${highlight ? 'text-blue-600 underline cursor-pointer' : 'text-gray-800'}`}>{value}</span>
                  }
                </div>
              ))}
              <div className="flex flex-col p-4 bg-gray-50 rounded-xl gap-2">
                <span className="font-semibold text-gray-500">Lời nhắn</span>
                <p className="text-gray-700 italic border-l-4 border-blue-200 pl-3 text-sm">
                  "{selected.message || 'Không có lời nhắn'}"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {(() => {
                const courseInfo = getSelectedCourseInfo();
                const currentStudents = courseInfo?.activeStudentCount || 0;
                const maxStudents = courseInfo?.classSize || 0;
                const full = maxStudents > 0 && currentStudents >= maxStudents;
                const almostFull = !full && maxStudents > 0 && (currentStudents / maxStudents) >= 0.8;
                return (
                  <>
                    {selected.status === 'not_contacted' && (
                      <button disabled={isUpdating}
                        onClick={async () => { await updateStudentStatus(selected._id, 'contacted'); setSelected(null); }}
                        className={`bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg text-sm ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isUpdating ? 'Đang cập nhật...' : '✅ Đánh dấu đã liên hệ'}
                      </button>
                    )}
                    {selected.status === 'contacted' && (
                      <span className="bg-amber-100 text-amber-700 py-3 rounded-2xl font-bold text-center border-2 border-amber-200 text-sm flex items-center justify-center">
                        📞 Đã liên hệ
                      </span>
                    )}
                    {selected.status === 'contacted' && (
                      <div className="flex flex-col gap-1.5">
                        {almostFull && (
                          <p className="text-amber-600 text-[10px] font-bold animate-pulse text-center">⚠️ Sắp đầy lớp ({currentStudents}/{maxStudents})</p>
                        )}
                        {full && (
                          <p className="text-red-600 text-[10px] font-bold text-center">🚫 Lớp đã đủ học viên ({currentStudents}/{maxStudents})</p>
                        )}
                        <button disabled={full || isUpdating}
                          onClick={async () => { await updateStudentStatus(selected._id, 'registered'); setSelected(null); }}
                          className={`text-white py-3 rounded-2xl font-bold transition-all shadow-lg text-sm ${full ? 'bg-gray-400 cursor-not-allowed' : isUpdating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          {isUpdating ? 'Đang xử lý...' : full ? 'Lớp đã đầy' : '🎓 Xác nhận đăng ký'}
                        </button>
                      </div>
                    )}
                    <button disabled={isUpdating} onClick={() => setSelected(null)}
                      className="bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-all text-sm">
                      Đóng
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Xoá đăng ký này?"
        message="Dữ liệu đăng ký sẽ bị xoá vĩnh viễn và không thể khôi phục. Bạn có chắc chắn?"
      />
    </div>
  );
};

export default RegistrationManagement;
