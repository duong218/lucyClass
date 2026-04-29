import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../utils/toastUtils';
import { exportSingleCourseExcel } from '../utils/exportStudentExcel';
import ConfirmModal from '../components/common/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  ArrowLeft, GraduationCap, Search, Settings2, Check, Save, Download,
  CheckCheck, X, RefreshCw, Star, ArrowRightLeft, UserMinus, Loader2,
  ClipboardCheck, BadgeCheck, ChevronDown, ChevronUp, StickyNote, Link, Pencil
} from 'lucide-react';

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
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center"><Star size={20} className="text-white" fill="white" /></div>
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
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Star size={12} className="text-amber-400" fill="currentColor" /> {t('ranking.starsLabel')}</label>
              <div className="flex items-center gap-3 w-full">
                <input type="number" min="0" max="100" value={stars} onChange={e => setStars(e.target.value)}
                  className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-2xl font-black text-amber-700 text-lg outline-none focus:border-amber-400 transition-all" placeholder="0 – 100" />
                <div className="flex items-center gap-1 text-2xl flex-shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className={`${stars && Number(stars) >= (i + 1) * 20 ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><BadgeCheck size={12} className="text-blue-500" /> {t('ranking.titleLabel')}</label>
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
// 🔄 Transfer Modal — chuyển lớp học viên
// ─────────────────────────────────────────────
const TransferModal = ({ student, currentCourse, onClose, onTransferred }) => {
  const [courses, setCourses]       = useState([]);
  const [selected, setSelected]     = useState('');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data.success) {
          setCourses(res.data.data.filter(c => c._id !== currentCourse?._id));
        }
      } catch (err) {
        showToast.error('Không thể tải danh sách khóa học');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [currentCourse]);

  const filteredCourses = useMemo(() =>
    courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [courses, search]
  );

  const handleTransfer = async () => {
    if (!selected) { showToast.error('Vui lòng chọn khóa học đích'); return; }
    setSaving(true);
    try {
      const res = await api.put(`/courses/students/${student._id}/transfer`, { toCourseId: selected });
      if (res.data.success) {
        showToast.success(res.data.message || 'Chuyển lớp thành công! 🎉');
        onTransferred(student._id, selected, res.data.data);
        onClose();
      }
    } catch (err) {
      showToast.error(err?.message || 'Chuyển lớp thất bại');
    } finally {
      setSaving(false);
    }
  };

  const selectedCourse = courses.find(c => c._id === selected);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
          initial={{ scale: 0.85, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}>

          {/* Header */}
          <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 p-6 relative overflow-hidden shrink-0">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all">
              <X size={14} />
            </button>
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center"><ArrowRightLeft size={20} className="text-white" /></div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Chuyển lớp học viên</h3>
                <p className="text-blue-100 text-xs font-medium mt-0.5">Chọn khóa học đích cho học viên</p>
              </div>
            </div>
          </div>

          {/* Student info */}
          <div className="px-6 pt-5 shrink-0">
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-base shrink-0">
                {student.childName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="font-black text-gray-800 text-sm truncate">{student.childName}</p>
                <p className="text-xs text-gray-500 font-medium truncate">
                  Đang học: <span className="text-blue-600 font-bold">{currentCourse?.name || '—'}</span>
                </p>
              </div>
              <span className="ml-auto text-lg shrink-0">→</span>
              <div className="min-w-0 text-right">
                {selectedCourse ? (
                  <p className="font-black text-indigo-600 text-sm truncate">{selectedCourse.name}</p>
                ) : (
                  <p className="text-xs text-gray-400 font-medium">Chưa chọn lớp</p>
                )}
              </div>
            </div>
          </div>

          {/* Search + list */}
          <div className="px-6 pt-4 pb-2 shrink-0">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={14} /></span>
              <input type="text" placeholder="Tìm khóa học..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm font-medium">
                Không tìm thấy khóa học nào
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCourses.map(course => {
                  const isFull = course.activeStudentCount >= course.classSize;
                  const isSelected = selected === course._id;
                  return (
                    <button key={course._id} type="button"
                      onClick={() => !isFull && setSelected(course._id)}
                      disabled={isFull}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 scale-[1.01]'
                          : isFull
                            ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                            : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-blue-50 hover:border-blue-200'
                      }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : isFull ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {course.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : ''}`}>{course.name}</p>
                        <p className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                          {course.ageGroup} · {course.activeStudentCount}/{course.classSize} học viên
                        </p>
                      </div>
                      {isFull && <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full shrink-0">ĐẦY</span>}
                      {isSelected && <Check size={16} className="text-white shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 flex gap-3 shrink-0 border-t border-gray-100">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all">
              Hủy
            </button>
            <button onClick={handleTransfer} disabled={!selected || saving}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
              {saving
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <RefreshCw size={14} className="animate-spin" />}
              Xác nhận chuyển
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// 🏷️ Transfer Badge — tooltip lịch sử chuyển lớp
// ─────────────────────────────────────────────
const TransferBadge = ({ transferHistory, allCourses }) => {
  const [show, setShow] = useState(false);
  if (!transferHistory || transferHistory.length === 0) return null;

  const getCourseName = (id) => {
    const found = allCourses.find(c => c._id === (id?._id || id)?.toString?.() || c._id === id?.toString?.() || c._id === id);
    return found?.name || id?.toString?.()?.slice(-4)?.toUpperCase() || '—';
  };

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow(v => !v)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black border border-violet-200 hover:bg-violet-200 transition-all cursor-pointer select-none"
        title="Xem lịch sử chuyển lớp">
        ĐÃ CHUYỂN
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 pointer-events-none">
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Lịch sử chuyển lớp</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {transferHistory.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-violet-500 font-black shrink-0 mt-0.5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-700 leading-snug">
                      <span className="text-rose-500">{getCourseName(t.fromCourseId)}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="text-emerald-600">{getCourseName(t.toCourseId)}</span>
                    </p>
                    <p className="text-gray-400 font-medium text-[10px] mt-0.5">
                      {t.transferredAt ? new Date(t.transferredAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      {t.transferredBy ? ` · ${t.transferredBy}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
        <Check size={11} strokeWidth={3} /> Có mặt
      </button>
    );
  }
  if (status === 'absent') {
    return (
      <button onClick={onClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-600 hover:bg-red-200 transition-all active:scale-95 border border-red-200 select-none">
        <X size={11} strokeWidth={3} /> Vắng
      </button>
    );
  }
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 border border-dashed border-gray-300 select-none">
      + Điểm danh
    </button>
  );
};

// ─────────────────────────────────────────────
// 📝 Note Cell — inline edit ghi chú / link
// Dùng endpoint /note riêng — cho phép cả admin và teacher
// ─────────────────────────────────────────────
const NoteCell = ({ studentId, initialNote, onSaved }) => {
  const [editing, setEditing]   = useState(false);
  const [value, setValue]       = useState(initialNote || '');
  const [saving, setSaving]     = useState(false);
  const inputRef                = useRef(null);

  // Sync khi note được poll từ bên ngoài cập nhật (chỉ khi không đang edit)
  useEffect(() => {
    if (!editing) {
      setValue(initialNote || '');
    }
  }, [initialNote, editing]);

  const isUrl = (str) => {
    try { return Boolean(new URL(str)); } catch { return false; }
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const MAX_NOTE = 500;
  const sanitize = (str) => str.replace(/<[^>]*>/gi, '');

  const handleSave = async () => {
    const cleaned = sanitize(value.trim());
    if (cleaned.length > MAX_NOTE) {
      showToast.error(`Ghi chú tối đa ${MAX_NOTE} ký tự`);
      return;
    }
    setSaving(true);
    try {
      // ✅ Dùng endpoint /note riêng — hoạt động cho cả admin và teacher
      await api.put(`/registrations/${studentId}/note`, { note: cleaned });
      onSaved(studentId, cleaned);
      setValue(cleaned);
      setEditing(false);
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || 'Lưu ghi chú thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setValue(initialNote || ''); setEditing(false); }
  };

  if (editing) {
    const remaining = MAX_NOTE - value.length;
    const isOverLimit = remaining < 0;
    return (
      <div className="flex items-start gap-1.5 min-w-[200px]">
        <div className="flex-1 flex flex-col gap-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={e => {
              const raw = e.target.value.replace(/<[^>]*>/gi, '');
              setValue(raw);
            }}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Ghi chú hoặc dán link..."
            className={`text-xs border rounded-xl px-3 py-2 outline-none focus:ring-2 resize-none font-medium text-gray-700 bg-white shadow-sm transition-colors ${
              isOverLimit
                ? 'border-red-400 focus:ring-red-200'
                : 'border-blue-300 focus:ring-blue-300'
            }`}
          />
          <span className={`text-[10px] font-bold text-right ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {value.length}/{MAX_NOTE}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={handleSave}
            disabled={saving || isOverLimit}
            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-60"
            title="Lưu (Enter)">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={3} />}
          </button>
          <button
            onClick={() => { setValue(initialNote || ''); setEditing(false); }}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
            title="Hủy (Esc)">
            <X size={12} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  }

  const trimmed = (value || '').trim();

  return (
    <div
      className="group flex items-start gap-1.5 cursor-pointer min-w-[140px] max-w-[220px]"
      onClick={() => setEditing(true)}
      title="Nhấn để chỉnh sửa ghi chú">
      <div className="flex-1 min-w-0">
        {trimmed ? (
          isUrl(trimmed) ? (
            <a
              href={trimmed}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline truncate max-w-full">
              <Link size={11} className="shrink-0" />
              <span className="truncate">{trimmed}</span>
            </a>
          ) : (
            <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-2 break-words">
              {trimmed}
            </p>
          )
        ) : (
          <span className="text-xs text-gray-300 font-medium italic group-hover:text-gray-400 transition-colors">
            + Thêm ghi chú
          </span>
        )}
      </div>
      <Pencil size={11} className="shrink-0 text-gray-300 group-hover:text-blue-400 transition-colors mt-0.5" />
    </div>
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
    const [allCourses, setAllCourses]            = useState([]);
    const [loading, setLoading]                 = useState(true);
    const [search, setSearch]                   = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter]                   = useState('all');
    const [showConfirm, setShowConfirm]         = useState(null);
    const [rankingStudent, setRankingStudent]   = useState(null);
    const [transferStudent, setTransferStudent] = useState(null);

    // ── Column visibility (mobile) ───────────────────────────────────────
    const ALL_COLUMNS = isTeacher
        ? ['age', 'parent', 'status']
        : ['age', 'parent', 'phone', 'status'];
    const COLUMN_LABELS = { age: 'Tuổi', parent: 'Phụ huynh', phone: 'SĐT', status: 'Trạng thái' };
    const [hiddenColumns, setHiddenColumns] = useState(
        isTeacher ? new Set(['age', 'parent', 'phone']) : new Set(['age', 'parent'])
    );
    const [showColPicker, setShowColPicker] = useState(false);

    // ── Track các note đang được edit (để không overwrite khi polling) ────
    // Key = studentId, value = true khi NoteCell đang mở editing
    // Dùng ref thay vì state để không gây re-render khi poll
    const editingNoteIds = useRef(new Set());

    const toggleColumn = (col) => {
        setHiddenColumns(prev => {
            const next = new Set(prev);
            next.has(col) ? next.delete(col) : next.add(col);
            return next;
        });
    };
    const isColVisible = (col) => !hiddenColumns.has(col);

    useEffect(() => {
        if (!showColPicker) return;
        const handler = (e) => {
            if (!e.target.closest('[data-col-picker]')) setShowColPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showColPicker]);

    // ── Attendance state ─────────────────────────────────────────────────
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate]           = useState(todayStr);
    const [attendanceMap, setAttendanceMap]          = useState({});
    const [attendanceLoading, setAttendanceLoading]  = useState(false);
    const [savingAttendance, setSavingAttendance]    = useState(false);
    const [attendanceDirty, setAttendanceDirty]      = useState(false);
    const [exportingExcel, setExportingExcel]         = useState(false);
    const [exportingStudents, setExportingStudents]   = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => { fetchData(); }, [courseId]);

    useEffect(() => {
        if (isTeacher && courseId) fetchAttendance(selectedDate);
    }, [selectedDate, courseId, isTeacher]);

    // ── Polling điểm danh mỗi 5s (chỉ teacher, không overwrite khi dirty) ──
    useEffect(() => {
        if (!isTeacher || !courseId) return;

        const poll = async () => {
            if (attendanceDirty) return;
            try {
                const res = await api.get(`/courses/${courseId}/attendance`, {
                    params: { date: selectedDate }
                });
                if (res.data.success) {
                    const map = {};
                    (res.data.data.records || []).forEach(r => {
                        map[r.studentId?.toString?.() || r.studentId] = r.status;
                    });
                    setAttendanceMap(map);
                }
            } catch {
                // poll thất bại thì im lặng
            }
        };

        const intervalId = setInterval(poll, 5000);
        return () => clearInterval(intervalId);
    }, [isTeacher, courseId, selectedDate, attendanceDirty]);

    // ── Polling ghi chú mỗi 5s — đồng bộ note giữa admin và các giáo viên ──
    // Không overwrite note của học sinh đang được edit
    useEffect(() => {
        if (!courseId) return;

        const pollNotes = async () => {
            try {
                const res = await api.get(`/courses/${courseId}/students`);
                if (!res.data.success) return;

                const freshStudents = res.data.data;
                setStudents(prev => prev.map(s => {
                    // Bỏ qua học sinh đang được edit note
                    if (editingNoteIds.current.has(s._id)) return s;

                    const fresh = freshStudents.find(f => f._id === s._id);
                    if (!fresh) return s;
                    // Chỉ update nếu note thực sự thay đổi (tránh re-render thừa)
                    if (fresh.note === s.note) return s;
                    return { ...s, note: fresh.note };
                }));
            } catch {
                // poll thất bại thì im lặng
            }
        };

        const intervalId = setInterval(pollNotes, 5000);
        return () => clearInterval(intervalId);
    }, [courseId]);

    useEffect(() => {
        if (!isTeacher) {
            api.get('/courses').then(res => {
                if (res.data.success) setAllCourses(res.data.data);
            }).catch(() => {});
        }
    }, [isTeacher]);

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

    const handleExportStudents = async () => {
        if (exportingStudents) return;
        setExportingStudents(true);
        showToast.info('Đang chuẩn bị file Excel...');
        try {
            // Teacher: ẩn số điện thoại phụ huynh trước khi xuất
            const exportStudents = isTeacher
                ? students.map(s => ({ ...s, phone: '***' }))
                : students;

            await exportSingleCourseExcel({ ...course, students: exportStudents });
            showToast.success(`Xuất Excel lớp "${course?.name}" thành công! 🎉`);
        } catch (err) {
            console.error('Export error:', err);
            showToast.error('Xuất file thất bại, vui lòng thử lại');
        } finally {
            setExportingStudents(false);
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

    const handleTransferred = useCallback((studentId, toCourseId, responseData) => {
        setStudents(prev => prev.filter(s => s._id !== studentId));
    }, []);

    // Callback cập nhật note local sau khi lưu thành công
    const handleNoteSaved = useCallback((studentId, newNote) => {
        setStudents(prev => prev.map(s => s._id === studentId ? { ...s, note: newNote } : s));
    }, []);

    // Callback để NoteCell báo trạng thái đang edit — ngăn polling overwrite
    const handleNoteEditingChange = useCallback((studentId, isEditing) => {
        if (isEditing) {
            editingNoteIds.current.add(studentId);
        } else {
            editingNoteIds.current.delete(studentId);
        }
    }, []);

    const filteredStudents = useMemo(() => students.filter(s => {
        // Teacher không nhận phone từ API nên không search theo phone (tránh crash + least privilege)
        const matchesSearch =
            s.childName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            s.parentName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (!isTeacher && (s.phone || '').includes(debouncedSearch));
        const matchesFilter = filter === 'all' || (filter === 'active' && s.isActive) || (filter === 'inactive' && !s.isActive);
        return matchesSearch && matchesFilter;
    }), [students, debouncedSearch, filter, isTeacher]);

    const attendanceSummary = useMemo(() => {
        const active  = students.filter(s => s.isActive);
        const present = active.filter(s => attendanceMap[s._id] === 'present').length;
        const absent  = active.filter(s => attendanceMap[s._id] === 'absent').length;
        const pending = active.filter(s => !attendanceMap[s._id]).length;
        return { total: active.length, present, absent, pending };
    }, [students, attendanceMap]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 size={36} className="animate-spin text-[#1C695C]" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center gap-4 flex-wrap">
                <button onClick={() => navigate(backRoute)}
                    className="p-3 bg-white border rounded-2xl hover:bg-gray-50 transition-all shadow-sm shrink-0"><ArrowLeft size={18} className="text-gray-600" /></button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-800 truncate">{course?.name || t('admin.course')}</h1>
                    <p className="text-sm text-gray-400 capitalize">
                        {isTeacher ? 'Lớp của tôi' : t('admin.studentMgmt')} / {course?.ageGroup}
                    </p>
                </div>
                {isTeacher && (
                    <span className="shrink-0 text-xs font-bold bg-[#1C695C]/10 text-[#1C695C] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <GraduationCap size={13} /> Chế độ giáo viên
                    </span>
                )}
                <button
                    onClick={handleExportStudents}
                    disabled={exportingStudents || students.length === 0}
                    title="Xuất danh sách học sinh lớp này ra Excel"
                    className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1C695C] to-[#3FA48F] hover:from-[#134d44] hover:to-[#1C695C] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm shadow-lg shadow-[#1C695C]/20 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                    {exportingStudents ? (
                        <><Loader2 size={14} className="animate-spin" /><span className="hidden sm:inline">Đang xuất...</span></>
                    ) : (
                        <><Download size={14} /><span className="hidden sm:inline">Xuất Excel</span></>
                    )}
                </button>
            </div>

            {/* ── Panel điểm danh (chỉ teacher) ── */}
            {isTeacher && (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="font-black text-gray-800 text-base flex items-center gap-2"><ClipboardCheck size={16} className="text-[#1C695C]" /> Điểm danh buổi học</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Chọn ngày và đánh dấu từng học sinh. Nhấn badge để toggle trạng thái.</p>
                        </div>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            max={todayStr}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-blue-400 transition-colors shrink-0" />
                    </div>

                    {!attendanceLoading && (
                        <div className="flex gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-black text-emerald-700">
                                <Check size={11} strokeWidth={3} /> Có mặt: {attendanceSummary.present}
                            </div>
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full text-xs font-black text-red-600">
                                <X size={11} strokeWidth={3} /> Vắng: {attendanceSummary.absent}
                            </div>
                            {attendanceSummary.pending > 0 && (
                                <div className="flex items-center gap-1.5 bg-gray-50 border border-dashed border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500">
                                    ? Chưa điểm: {attendanceSummary.pending}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 flex-wrap items-center">
                        <button onClick={markAllPresent}
                            className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all active:scale-95 flex items-center gap-1.5">
                            <CheckCheck size={13} /> Tất cả có mặt
                        </button>
                        <button onClick={handleSaveAttendance} disabled={savingAttendance || !attendanceDirty}
                            className={`text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ${
                                attendanceDirty
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}>
                            {savingAttendance
                                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Save size={13} />}
                            {attendanceDirty ? 'Lưu điểm danh' : 'Đã lưu'}
                        </button>
                        {attendanceLoading && <span className="text-xs text-gray-400 animate-pulse">Đang tải...</span>}
                        <button onClick={handleExportExcel} disabled={exportingExcel}
                            className="text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed ml-auto">
                            {exportingExcel
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Download size={13} />}
                            Xuất Excel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Bảng học sinh ── */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={15} /></span>
                        <input type="text" placeholder={t('admin.search')}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                        {['all', 'active', 'inactive'].map(f => {
                            const labels = { all: t('admin.filterAll'), active: t('admin.active'), inactive: t('admin.inactive') };
                            return (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}>{labels[f]}</button>
                            );
                        })}

                        <div className="relative ml-auto" data-col-picker>
                            <button
                                onClick={() => setShowColPicker(v => !v)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                                    showColPicker
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200'
                                }`}
                                title="Ẩn/hiện cột">
                                <Settings2 size={15} />
                                <span className="hidden sm:inline">Cột</span>
                                {hiddenColumns.size > 0 && (
                                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-black">
                                        {hiddenColumns.size}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showColPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 min-w-[160px]">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Hiện/Ẩn cột</p>
                                        {ALL_COLUMNS.map(col => (
                                            <button key={col} onClick={() => toggleColumn(col)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all mb-1 last:mb-0 ${
                                                    isColVisible(col)
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-gray-50 text-gray-400'
                                                }`}>
                                                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                    isColVisible(col) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                                                }`}>
                                                    {isColVisible(col) ? <Check size={10} strokeWidth={3} /> : null}
                                                </span>
                                                {COLUMN_LABELS[col]}
                                            </button>
                                        ))}
                                        <div className="border-t border-gray-100 mt-2 pt-2">
                                            <button onClick={() => setHiddenColumns(isTeacher ? new Set(['phone']) : new Set())}
                                                className="w-full text-xs font-bold text-blue-500 hover:text-blue-700 py-1 transition-all">
                                                Hiện tất cả
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b text-gray-400 text-xs uppercase tracking-wider font-extrabold">
                                <th className="pb-4 px-4">STT</th>
                                <th className="pb-4 px-4">{t('admin.child')}</th>
                                {isColVisible('age') && <th className="pb-4 px-4">{t('admin.age')}</th>}
                                {isColVisible('parent') && <th className="pb-4 px-4">{t('admin.parent')}</th>}
                                {isColVisible('phone') && <th className="pb-4 px-4">{t('admin.phone')}</th>}
                                {isColVisible('status') && <th className="pb-4 px-4">{t('admin.status')}</th>}
                                {isTeacher ? (
                                    <>
                                        <th className="pb-4 px-4 text-center">Điểm danh</th>
                                        <th className="pb-4 px-4">Ghi chú</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="pb-4 px-4 text-center">{t('ranking.column')}</th>
                                        <th className="pb-4 px-4">Ghi chú</th>
                                        <th className="pb-4 px-4 text-center">{t('admin.actions')}</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={(isTeacher ? 3 : 5) + (ALL_COLUMNS.length - hiddenColumns.size)} className="py-12 text-center text-gray-400">
                                        {t('admin.emptyStudents')}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s, i) => (
                                    <tr key={s._id}
                                        className={`hover:bg-gray-50/50 transition-colors ${!s.isActive ? 'bg-gray-50 italic opacity-70' : ''}`}>
                                        <td className="py-5 px-4 text-sm font-bold text-gray-400">{(i + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-5 px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-gray-800">{s.childName}</span>
                                                <TransferBadge
                                                    transferHistory={s.transferHistory}
                                                    allCourses={allCourses}
                                                />
                                            </div>
                                        </td>
                                        {isColVisible('age') && <td className="py-5 px-4 text-sm text-gray-600 font-medium">{s.childAge}</td>}
                                        {isColVisible('parent') && <td className="py-5 px-4 text-sm text-gray-600 font-medium">{s.parentName}</td>}
                                        {isColVisible('phone') && <td className="py-5 px-4 text-sm text-gray-600 font-medium font-mono">{s.phone}</td>}
                                        {isColVisible('status') && (
                                        <td className="py-5 px-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                                s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {s.isActive ? t('admin.active') : t('admin.inactive')}
                                            </span>
                                        </td>
                                        )}

                                        {isTeacher ? (
                                            <>
                                                <td className="py-5 px-4">
                                                    <div className="flex justify-center">
                                                        <AttendanceBadge
                                                            status={s.isActive ? attendanceMap[s._id] : null}
                                                            disabled={!s.isActive}
                                                            onClick={() => s.isActive && toggleAttendance(s._id)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <NoteCell
                                                        studentId={s._id}
                                                        initialNote={s.note}
                                                        onSaved={handleNoteSaved}
                                                        onEditingChange={handleNoteEditingChange}
                                                    />
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="py-5 px-4">
                                                    <div className="flex justify-center">
                                                        <motion.button disabled={!s.isActive}
                                                            onClick={() => s.isActive && setRankingStudent(s)}
                                                            whileHover={s.isActive ? { scale: 1.3, rotate: 15 } : {}}
                                                            whileTap={s.isActive ? { scale: 0.9 } : {}}
                                                            className={`text-2xl transition-all ${s.isActive ? 'cursor-pointer drop-shadow-md hover:drop-shadow-lg' : 'opacity-20 cursor-not-allowed grayscale'}`}
                                                            title={t('ranking.addToRanking')}><Star size={18} fill={s.isActive ? 'currentColor' : 'none'} /></motion.button>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <NoteCell
                                                        studentId={s._id}
                                                        initialNote={s.note}
                                                        onSaved={handleNoteSaved}
                                                        onEditingChange={handleNoteEditingChange}
                                                    />
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        <motion.button
                                                            disabled={!s.isActive}
                                                            onClick={() => s.isActive && setTransferStudent(s)}
                                                            whileHover={s.isActive ? { scale: 1.15, rotate: 180 } : {}}
                                                            whileTap={s.isActive ? { scale: 0.9 } : {}}
                                                            transition={{ duration: 0.3 }}
                                                            className={`p-2 rounded-xl transition-all ${
                                                                s.isActive
                                                                    ? 'text-[#1C6970] hover:bg-[#1C6970]/10 active:scale-95'
                                                                    : 'text-gray-300 cursor-not-allowed opacity-50'
                                                            }`}
                                                            title="Chuyển lớp">
                                                            <ArrowRightLeft size={16} />
                                                        </motion.button>
                                                        <button
                                                            disabled={!s.isActive}
                                                            onClick={() => setShowConfirm(s)}
                                                            className={`p-2 rounded-xl transition-all ${
                                                                s.isActive
                                                                    ? 'text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95'
                                                                    : 'text-gray-300 cursor-not-allowed opacity-50'
                                                            }`}
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

            {/* ── Modals ── */}
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

            {transferStudent && (
                <TransferModal
                    student={transferStudent}
                    currentCourse={course}
                    onClose={() => setTransferStudent(null)}
                    onTransferred={handleTransferred}
                />
            )}
        </div>
    );
};

export default CourseStudentList;
