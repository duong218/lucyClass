import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../utils/toastUtils';
import ConfirmModal from '../components/common/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ─────────────────────────────────────────────
// 🏅 Ranking Modal (admin only)
// ─────────────────────────────────────────────
const TITLE_OPTIONS = [
  { value: 'Tiến bộ vượt bậc', emoji: '🚀' },
  { value: 'Phát âm tốt',       emoji: '🎤' },
  { value: 'Top Speaking',       emoji: '🗣️' },
  { value: 'Hoàn thành bài tập', emoji: '✅' },
  { value: 'Sáng tạo',           emoji: '✨' },
];

const RankingModal = ({ student, course, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [stars, setStars]   = useState('');
  const [title, setTitle]   = useState('');
  const [skill, setSkill]   = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!stars || !title || !skill.trim()) { showToast.error(t('ranking.fillRequired')); return; }
    setSaving(true);
    try {
      await api.post('/rankings', {
        studentId: student._id, courseId: course?._id,
        childName: student.childName, courseName: course?.name,
        stars: Number(stars), title, skill: skill.trim(),
      });
      showToast.success(t('ranking.saveSuccess'));
      onSaved?.();
      onClose();
    } catch (err) {
      showToast.error(err?.message || t('ranking.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden"
          initial={{ scale: 0.85, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
          <div className="bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-400 p-6 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10 flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">{t('ranking.modalTitle')}</h3>
                <p className="text-yellow-100 text-xs font-medium">{t('ranking.modalSubtitle')}</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('admin.child')}</label>
                <p className="font-bold text-gray-800 text-sm truncate">{student.childName}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('admin.course')}</label>
                <p className="font-bold text-gray-800 text-sm truncate">{course?.name || '—'}</p>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">⭐ {t('ranking.starsLabel')}</label>
              <div className="flex items-center gap-3 w-full">
                <input type="number" min="0" max="100" value={stars} onChange={e => setStars(e.target.value)}
                  className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-2xl font-black text-amber-700 text-lg outline-none focus:border-amber-400 transition-all" placeholder="0 – 100" />
                <div className="flex items-center gap-1 text-2xl flex-shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`select-none ${stars && Number(stars) >= (i + 1) * 20 ? 'grayscale-0' : 'grayscale opacity-30'}`}>⭐</span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">🎖️ {t('ranking.titleLabel')}</label>
              <div className="grid grid-cols-1 gap-2">
                {TITLE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setTitle(opt.value)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all text-left ${
                      title === opt.value ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                    }`}>
                    <span className="text-lg">{opt.emoji}</span>{opt.value}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">💡 {t('ranking.skillLabel')}</label>
              <input type="text" value={skill} onChange={e => setSkill(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-gray-700 outline-none focus:border-blue-400 transition-all"
                placeholder="vd: Pronunciation, Reading..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all">{t('admin.cancel')}</button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black shadow-lg shadow-amber-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>🏅 {t('admin.confirm')}</>}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// ✅ Attendance Badge — toggle có mặt / vắng
// ─────────────────────────────────────────────
const AttendanceBadge = ({ status, onClick, disabled }) => {
  if (disabled) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-300 cursor-not-allowed select-none">
        — Nghỉ học
      </span>
    );
  }
  if (status === 'present') {
    return (
      <button onClick={onClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all active:scale-95 border border-emerald-200 select-none">
        ✓ Có mặt
      </button>
    );
  }
  if (status === 'absent') {
    return (
      <button onClick={onClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-600 hover:bg-red-200 transition-all active:scale-95 border border-red-200 select-none">
        ✗ Vắng
      </button>
    );
  }
  // Chưa điểm danh
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 border border-dashed border-gray-300 select-none">
      + Điểm danh
    </button>
  );
};

// ─────────────────────────────────────────────
// 📋 Main Component
// ─────────────────────────────────────────────
const CourseStudentList = () => {
    const { t } = useTranslation();
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isTeacher = user?.role === 'teacher';
    const backRoute = isTeacher ? '/teacher/dashboard' : '/admin/students';

    const [students, setStudents]               = useState([]);
    const [course, setCourse]                   = useState(null);
    const [loading, setLoading]                 = useState(true);
    const [search, setSearch]                   = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter]                   = useState('all');
    const [showConfirm, setShowConfirm]         = useState(null);
    const [rankingStudent, setRankingStudent]   = useState(null);

    // ── Attendance state ─────────────────────────────────────────────────
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate]           = useState(todayStr);
    const [attendanceMap, setAttendanceMap]          = useState({}); // { studentId: 'present'|'absent' }
    const [attendanceLoading, setAttendanceLoading]  = useState(false);
    const [savingAttendance, setSavingAttendance]    = useState(false);
    const [attendanceDirty, setAttendanceDirty]      = useState(false);
    const [exportingExcel, setExportingExcel]         = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => { fetchData(); }, [courseId]);

    useEffect(() => {
        if (isTeacher && courseId) fetchAttendance(selectedDate);
    }, [selectedDate, courseId, isTeacher]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, courseRes] = await Promise.all([
                api.get(`/courses/${courseId}/students`),
                api.get(`/courses/${courseId}`)
            ]);
            if (studentsRes.data.success) setStudents(studentsRes.data.data);
            if (courseRes.data.success)   setCourse(courseRes.data.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showToast.error(t('admin.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async (dateStr) => {
        setAttendanceLoading(true);
        setAttendanceDirty(false);
        try {
            const res = await api.get(`/courses/${courseId}/attendance`, { params: { date: dateStr } });
            if (res.data.success) {
                const map = {};
                (res.data.data.records || []).forEach(r => {
                    map[r.studentId?.toString?.() || r.studentId] = r.status;
                });
                setAttendanceMap(map);
            }
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
        } finally {
            setAttendanceLoading(false);
        }
    };

    const toggleAttendance = useCallback((studentId) => {
        setAttendanceMap(prev => {
            const current = prev[studentId];
            const next = current === 'present' ? 'absent' : 'present';
            return { ...prev, [studentId]: next };
        });
        setAttendanceDirty(true);
    }, []);

    const handleExportExcel = async () => {
        setExportingExcel(true);
        try {
            const res = await api.get(`/courses/${courseId}/attendance/export-excel`, {
                params: { date: selectedDate },
                responseType: 'blob'
            });
            const url  = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            const safeName = (course?.name || 'lop').replace(/[^a-zA-Z0-9_\-]/g, '_');
            link.href     = url;
            link.setAttribute('download', `diemdanh_${safeName}_${selectedDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast.success('Xuất Excel thành công! 📊');
        } catch (err) {
            showToast.error('Xuất Excel thất bại');
        } finally {
            setExportingExcel(false);
        }
    };

    const markAllPresent = () => {
        const map = {};
        students.filter(s => s.isActive).forEach(s => { map[s._id] = 'present'; });
        setAttendanceMap(map);
        setAttendanceDirty(true);
    };

    const handleSaveAttendance = async () => {
        const activeStudents = students.filter(s => s.isActive);
        if (activeStudents.length === 0) { showToast.error('Không có học sinh nào để điểm danh'); return; }
        const records = activeStudents.map(s => ({
            studentId: s._id,
            status: attendanceMap[s._id] || 'absent'
        }));
        setSavingAttendance(true);
        try {
            await api.post(`/courses/${courseId}/attendance`, { date: selectedDate, records });
            showToast.success('Lưu điểm danh thành công! ✅');
            setAttendanceDirty(false);
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Lưu điểm danh thất bại');
        } finally {
            setSavingAttendance(false);
        }
    };

    const handleRemove = async (studentId) => {
        setShowConfirm(null);
        const originalStudents = [...students];
        setStudents(prev => prev.map(s => s._id === studentId ? { ...s, isActive: false } : s));
        try {
            const res = await api.put(`/students/${studentId}/remove`);
            if (res.data.success) showToast.success(t('admin.updateSuccess'));
            else throw new Error(res.data.message);
        } catch (error) {
            setStudents(originalStudents);
            showToast.error(error.response?.data?.message || t('admin.updateFailed'));
        }
    };

    const filteredStudents = useMemo(() => students.filter(s => {
        const matchesSearch =
            s.childName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            s.parentName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            s.phone.includes(debouncedSearch);
        const matchesFilter = filter === 'all' || (filter === 'active' && s.isActive) || (filter === 'inactive' && !s.isActive);
        return matchesSearch && matchesFilter;
    }), [students, debouncedSearch, filter]);

    const attendanceSummary = useMemo(() => {
        const active  = students.filter(s => s.isActive);
        const present = active.filter(s => attendanceMap[s._id] === 'present').length;
        const absent  = active.filter(s => attendanceMap[s._id] === 'absent').length;
        const pending = active.filter(s => !attendanceMap[s._id]).length;
        return { total: active.length, present, absent, pending };
    }, [students, attendanceMap]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <span className="text-4xl animate-bounce">⏳</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center gap-4 flex-wrap">
                <button onClick={() => navigate(backRoute)}
                    className="p-3 bg-white border rounded-2xl hover:bg-gray-50 transition-all shadow-sm shrink-0">←</button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-800 truncate">{course?.name || t('admin.course')}</h1>
                    <p className="text-sm text-gray-400 capitalize">
                        {isTeacher ? 'Lớp của tôi' : t('admin.studentMgmt')} / {course?.ageGroup}
                    </p>
                </div>
                {isTeacher && (
                    <span className="shrink-0 text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
                        👩‍🏫 Chế độ giáo viên
                    </span>
                )}
            </div>

            {/* ── Panel điểm danh (chỉ teacher) ── */}
            {isTeacher && (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="font-black text-gray-800 text-base">📋 Điểm danh buổi học</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Chọn ngày và đánh dấu từng học sinh. Nhấn badge để toggle trạng thái.</p>
                        </div>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            max={todayStr}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-blue-400 transition-colors shrink-0" />
                    </div>

                    {/* Thống kê nhanh */}
                    {!attendanceLoading && (
                        <div className="flex gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-black text-emerald-700">
                                ✓ Có mặt: {attendanceSummary.present}
                            </div>
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full text-xs font-black text-red-600">
                                ✗ Vắng: {attendanceSummary.absent}
                            </div>
                            {attendanceSummary.pending > 0 && (
                                <div className="flex items-center gap-1.5 bg-gray-50 border border-dashed border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500">
                                    ? Chưa điểm: {attendanceSummary.pending}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap items-center">
                        <button onClick={markAllPresent}
                            className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all active:scale-95">
                            ✓ Tất cả có mặt
                        </button>
                        <button onClick={handleSaveAttendance} disabled={savingAttendance || !attendanceDirty}
                            className={`text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ${
                                attendanceDirty
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}>
                            {savingAttendance
                                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : '💾'}
                            {attendanceDirty ? 'Lưu điểm danh' : 'Đã lưu'}
                        </button>
                        {attendanceLoading && <span className="text-xs text-gray-400 animate-pulse">Đang tải...</span>}
                        <button onClick={handleExportExcel} disabled={exportingExcel}
                            className="text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed ml-auto">
                            {exportingExcel
                                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : '📊'}
                            Xuất Excel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Bảng học sinh ── */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input type="text" placeholder={t('admin.search')}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'active', 'inactive'].map(f => {
                            const labels = { all: t('admin.filterAll'), active: t('admin.active'), inactive: t('admin.inactive') };
                            return (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}>{labels[f]}</button>
                            );
                        })}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b text-gray-400 text-xs uppercase tracking-wider font-extrabold">
                                <th className="pb-4 px-4">STT</th>
                                <th className="pb-4 px-4">{t('admin.child')}</th>
                                <th className="pb-4 px-4">{t('admin.age')}</th>
                                <th className="pb-4 px-4">{t('admin.parent')}</th>
                                <th className="pb-4 px-4">{t('admin.phone')}</th>
                                <th className="pb-4 px-4">{t('admin.status')}</th>
                                {isTeacher ? (
                                    <th className="pb-4 px-4 text-center">Điểm danh</th>
                                ) : (
                                    <>
                                        <th className="pb-4 px-4 text-center">{t('ranking.column')}</th>
                                        <th className="pb-4 px-4 text-center">{t('admin.actions')}</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={isTeacher ? 7 : 8} className="py-12 text-center text-gray-400">
                                        {t('admin.emptyStudents')}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s, i) => (
                                    <tr key={s._id}
                                        className={`hover:bg-gray-50/50 transition-colors ${!s.isActive ? 'bg-gray-50 italic opacity-70' : ''}`}>
                                        <td className="py-5 px-4 text-sm font-bold text-gray-400">{(i + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-5 px-4 font-bold text-gray-800">{s.childName}</td>
                                        <td className="py-5 px-4 text-sm text-gray-600 font-medium">{s.childAge}</td>
                                        <td className="py-5 px-4 text-sm text-gray-600 font-medium">{s.parentName}</td>
                                        <td className="py-5 px-4 text-sm text-gray-600 font-medium font-mono">{s.phone}</td>
                                        <td className="py-5 px-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                                s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {s.isActive ? t('admin.active') : t('admin.inactive')}
                                            </span>
                                        </td>

                                        {isTeacher ? (
                                            <td className="py-5 px-4">
                                                <div className="flex justify-center">
                                                    <AttendanceBadge
                                                        status={s.isActive ? attendanceMap[s._id] : null}
                                                        disabled={!s.isActive}
                                                        onClick={() => s.isActive && toggleAttendance(s._id)}
                                                    />
                                                </div>
                                            </td>
                                        ) : (
                                            <>
                                                <td className="py-5 px-4">
                                                    <div className="flex justify-center">
                                                        <motion.button disabled={!s.isActive}
                                                            onClick={() => s.isActive && setRankingStudent(s)}
                                                            whileHover={s.isActive ? { scale: 1.3, rotate: 15 } : {}}
                                                            whileTap={s.isActive ? { scale: 0.9 } : {}}
                                                            className={`text-2xl transition-all ${s.isActive ? 'cursor-pointer drop-shadow-md hover:drop-shadow-lg' : 'opacity-20 cursor-not-allowed grayscale'}`}
                                                            title={t('ranking.addToRanking')}>⭐</motion.button>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="flex justify-center">
                                                        <button disabled={!s.isActive} onClick={() => setShowConfirm(s)}
                                                            className={`p-2 rounded-xl transition-all ${s.isActive ? 'text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95' : 'text-gray-300 cursor-not-allowed opacity-50'}`}
                                                            title={t('admin.delete')}>❌</button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!isTeacher && (
                <ConfirmModal
                    isOpen={!!showConfirm} onClose={() => setShowConfirm(null)}
                    onConfirm={() => handleRemove(showConfirm._id)}
                    title={t('admin.confirm') || 'Chắc chắn xoá chứ?'}
                    message={t('admin.removeConfirm') || 'Hành động này sẽ thay đổi trạng thái của học viên!'}
                />
            )}

            {rankingStudent && (
                <RankingModal student={rankingStudent} course={course}
                    onClose={() => setRankingStudent(null)} onSaved={() => {}} />
            )}
        </div>
    );
};

export default CourseStudentList;
