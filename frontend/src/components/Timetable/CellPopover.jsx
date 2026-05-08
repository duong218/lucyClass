import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { HiCheck, HiX, HiTrash } from 'react-icons/hi';
import { HiPaintBrush } from 'react-icons/hi2';
import { UserPlus } from 'lucide-react';
import api from '../../services/api';
import timetableService from '../../services/timetableService';
import {
  deleteSessionTeachers,
  getCourseTeachers,
  getSessionTeachers,
  upsertSessionTeachers
} from '../../services/salaryService';
import { showToast } from '../../utils/toastUtils';
import { LUCY_BRAND } from '../../theme/lucyBrand';
import { openModal, closeModal } from '../../utils/modalScrollLock';

const PRESET_COLORS = [
  '#3B82F6',
  '#F97316',
  '#22C55E',
  '#EF4444',
  '#A855F7',
  '#06B6D4',
  '#EAB308',
  '#EC4899',
  '#78350F',
  '#64748B'
];

const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_VI = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

const SESSION_ROLES = [
  { value: 'full_time', label: 'Full-time (100%)' },
  { value: 'part_time', label: 'Part-time (80%)' },
  { value: 'thu_viec', label: 'Thử việc (70%)' },
  { value: 'teacher_assistant', label: 'Trợ giảng' },
  { value: 'observe', label: 'Dự giờ' }
];

const PAY_TIERS = [
  { value: 'full_time', label: 'Cột lương FT (100%)' },
  { value: 'part_time', label: 'Cột lương PT (80%)' },
  { value: 'thu_viec', label: 'Cột lương thử việc (70%)' }
];

const TA_OR_OB = ['teacher_assistant', 'observe'];

const getContrastColor = (hex) => {
  if (!hex || hex === 'transparent' || !hex.startsWith('#')) return 'text-gray-800';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'text-gray-800' : 'text-white';
};

const selectCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:ring-2 focus:ring-[#1C695C]/25 focus:border-[#1C695C] outline-none';

/**
 * Popup ô TKB — đặc tả mục 4: khóa học, GV1+2, vai trò buổi, payTier (trợ giảng/dự giờ), ghi chú, màu.
 * onSaved: gọi sau khi lưu thành công (parent refetch TKB).
 */
const CellPopover = ({ cell, row, dayIndex, weekDate, onSaved, onClose }) => {
  const { i18n } = useTranslation();
  const textareaRef = useRef(null);

  const [note, setNote] = useState(cell?.note || '');
  const [color, setColor] = useState(cell?.color || '#E3F2FD');
  const [isSaving, setIsSaving] = useState(false);

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [courseTeachers, setCourseTeachers] = useState([]);
  const [courseMeta, setCourseMeta] = useState(null);
  const [mainStaffId, setMainStaffId] = useState('');
  const [mainRole, setMainRole] = useState('full_time');
  const [mainPayTier, setMainPayTier] = useState('full_time');
  const [showSecond, setShowSecond] = useState(false);
  const [secondStaffId, setSecondStaffId] = useState('');
  const [secondRole, setSecondRole] = useState('full_time');
  const [secondPayTier, setSecondPayTier] = useState('full_time');
  const [loadingSession, setLoadingSession] = useState(false);

  const MAX_LENGTH = 1000;

  useEffect(() => {
    let cancel = false;
    api
      .get('/courses')
      .then((res) => {
        if (!cancel) setCourses(res.data?.data || []);
      })
      .catch(() => {
        if (!cancel) setCourses([]);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    setNote(cell?.note || '');
    setColor(cell?.color || '#E3F2FD');
  }, [cell?._id, cell?.note, cell?.color]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Khoá scroll trang khi modal mở, mở lại khi đóng
  useEffect(() => {
    openModal();
    return () => closeModal();
  }, []);


  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!cell?._id) {
        if (!cancel) {
          setCourseId('');
          setMainStaffId('');
          setMainRole('full_time');
          setMainPayTier('full_time');
          setSecondStaffId('');
          setSecondRole('full_time');
          setSecondPayTier('full_time');
          setShowSecond(false);
          setCourseTeachers([]);
          setCourseMeta(null);
        }
        return;
      }
      setLoadingSession(true);
      try {
        const res = await getSessionTeachers(cell._id);
        const list = res.data?.data || [];
        if (cancel) return;
        if (list.length === 0) {
          setCourseId('');
          setMainStaffId('');
          setMainRole('full_time');
          setMainPayTier('full_time');
          setSecondStaffId('');
          setSecondRole('full_time');
          setSecondPayTier('full_time');
          setShowSecond(false);
          return;
        }
        const main = list.find((t) => t.isMain) || list[0];
        const sec = list.find((t) => !t.isMain);
        const cid = main.courseId?._id?.toString() || main.courseId?.toString() || '';
        setCourseId(cid);
        setMainStaffId(main.teacherId?._id?.toString() || main.teacherId?.toString() || '');
        setMainRole(main.sessionRole || 'full_time');
        setMainPayTier(main.payTier || 'full_time');
        if (sec) {
          setShowSecond(true);
          setSecondStaffId(sec.teacherId?._id?.toString() || sec.teacherId?.toString() || '');
          setSecondRole(sec.sessionRole || 'full_time');
          setSecondPayTier(sec.payTier || 'full_time');
        } else {
          setShowSecond(false);
          setSecondStaffId('');
          setSecondRole('full_time');
          setSecondPayTier('full_time');
        }
      } catch (e) {
        if (!cancel) console.error('[CellPopover] load session teachers', e);
      } finally {
        if (!cancel) setLoadingSession(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [cell?._id]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!courseId) {
        setCourseTeachers([]);
        setCourseMeta(null);
        return;
      }
      try {
        const res = await getCourseTeachers(courseId);
        if (cancel) return;
        const d = res.data?.data;
        setCourseTeachers(d?.teachers || []);
        setCourseMeta(d?.course || null);
      } catch {
        if (!cancel) {
          setCourseTeachers([]);
          setCourseMeta(null);
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId]);

  const onCourseChange = useCallback((id) => {
    setCourseId(id);
    setMainStaffId('');
    setSecondStaffId('');
    setShowSecond(false);
  }, []);

  const buildTeacher = (staffId, role, cid, isMain, payTierVal) => {
    const o = { teacherId: staffId, sessionRole: role, courseId: cid, isMain };
    if (TA_OR_OB.includes(role)) o.payTier = payTierVal || 'full_time';
    return o;
  };

  const handleSave = async () => {
    const safeColor =
      color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#E3F2FD';
    const weekIso = weekDate instanceof Date ? weekDate.toISOString() : new Date().toISOString();

    if (courseId) {
      if (!mainStaffId || !mainRole) {
        showToast.error('Chọn đủ khóa học, giáo viên thứ nhất và vai trò buổi.');
        return;
      }
      if (courseTeachers.length === 0) {
        showToast.error('Khóa học chưa có giáo viên gắn tài khoản đăng nhập (Staff). Cập nhật ở quản lý khóa học.');
        return;
      }
      if (showSecond) {
        if (!secondStaffId || !secondRole) {
          showToast.error('Chọn giáo viên thứ hai và vai trò, hoặc bỏ dòng GV2.');
          return;
        }
        if (secondStaffId === mainStaffId) {
          showToast.error('Không được chọn cùng một giáo viên cho cả hai vị trí.');
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const cellRes = await timetableService.upsertCell({
        rowId: row?._id,
        dayOfWeek: dayIndex + 1,
        weekDate: weekIso,
        note: note.trim(),
        color: safeColor
      });

      const cellId = cellRes?.data?._id?.toString() || cell?._id?.toString();
      if (!cellId) {
        showToast.error('Không lấy được ID ô TKB sau khi lưu.');
        return;
      }

      if (courseId && mainStaffId && mainRole) {
        const teachers = [
          buildTeacher(mainStaffId, mainRole, courseId, true, mainPayTier)
        ];
        if (showSecond && secondStaffId && secondRole) {
          teachers.push(buildTeacher(secondStaffId, secondRole, courseId, false, secondPayTier));
        }
        await upsertSessionTeachers(cellId, teachers);
      } else {
        try {
          await deleteSessionTeachers(cellId);
        } catch {
          /* 404 nếu chưa có session */
        }
      }

      showToast.success('Đã lưu ô thời khóa biểu.');
      if (typeof onSaved === 'function') onSaved();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Lưu thất bại. Vui lòng thử lại.';
      showToast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!cell?._id) {
      showToast.info('Ô này chưa được lưu, không cần xóa.');
      return;
    }
    const confirmed = await showToast.confirm('Bạn có chắc chắn muốn xóa ô lịch này? (Sẽ xóa cả phân công giáo viên)');
    if (!confirmed) return;
    setIsSaving(true);
    try {
      await timetableService.deleteCell(cell._id);
      showToast.success('Đã xóa ô thời khóa biểu.');
      if (typeof onSaved === 'function') onSaved();
      onClose();
    } catch (err) {
      console.error('[CellPopover] handleDelete error', err);
      showToast.error(err?.response?.data?.message || 'Lỗi khi xóa ô TKB.');
    } finally {
      setIsSaving(false);
    }
  };

  const dayName = (i18n.language === 'vi' ? DAYS_VI : DAYS_EN)[dayIndex] || '';
  const previewBg = color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#E3F2FD';
  const textColorClass = getContrastColor(previewBg);
  const timeLabel =
    row?.startTime && row?.endTime ? `${row.startTime}–${row.endTime}` : row?.timeSlot || '—';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest"
                style={{ background: LUCY_BRAND.primary }}
              >
                {dayName}
              </span>
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">
                Buổi dạy &amp; lương
              </h3>
            </div>
            <p className="text-xs font-bold text-gray-400">
              {row?.roomName} • {timeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <HiX className="text-2xl" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar flex-1" onWheel={(e) => e.stopPropagation()}>
          {loadingSession && (
            <p className="text-xs text-gray-400 font-medium">Đang tải phân công giáo viên…</p>
          )}

          <section className="space-y-3 rounded-2xl border border-gray-100 bg-[#F8FAFC] p-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Khóa học &amp; giáo viên (tính lương theo buổi)
            </h4>

            <label className="block text-xs font-bold text-gray-600">
              Khóa học
              <select
                className={`${selectCls} mt-1`}
                value={courseId}
                onChange={(e) => onCourseChange(e.target.value)}
              >
                <option value="">— Không gắn khóa (chỉ ghi chú) —</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {courseId && courseMeta && (
              <p className="text-xs text-gray-500">
                Số học sinh (đăng ký / lớp):{' '}
                <strong className="text-gray-800">{courseMeta.studentCount ?? '—'}</strong>
              </p>
            )}

            {courseId && (
              <>
                <label className="block text-xs font-bold text-gray-600">
                  Giáo viên thứ nhất
                  <select
                    className={`${selectCls} mt-1`}
                    value={mainStaffId}
                    onChange={(e) => setMainStaffId(e.target.value)}
                  >
                    <option value="">— Chọn —</option>
                    {courseTeachers.map((t) => (
                      <option key={t.staffId} value={t.staffId}>
                        {t.displayName}
                        {t.isMain ? ' (chính)' : ' (phụ)'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-gray-600">
                  Vai trò trong buổi (GV1)
                  <select
                    className={`${selectCls} mt-1`}
                    value={mainRole}
                    onChange={(e) => setMainRole(e.target.value)}
                  >
                    {SESSION_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>

                {TA_OR_OB.includes(mainRole) && (
                  <label className="block text-xs font-bold text-gray-600">
                    Mức lương trợ giảng / dự giờ
                    <select
                      className={`${selectCls} mt-1`}
                      value={mainPayTier}
                      onChange={(e) => setMainPayTier(e.target.value)}
                    >
                      {PAY_TIERS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {!showSecond ? (
                  <button
                    type="button"
                    onClick={() => setShowSecond(true)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl border-2 border-dashed transition-colors hover:bg-white"
                    style={{ borderColor: LUCY_BRAND.primary, color: LUCY_BRAND.primary }}
                  >
                    <UserPlus className="w-4 h-4" />
                    Thêm giáo viên thứ hai
                  </button>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-gray-600 uppercase">Giáo viên thứ hai</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSecond(false);
                          setSecondStaffId('');
                          setSecondRole('full_time');
                          setSecondPayTier('full_time');
                        }}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        ✕ Bỏ GV2
                      </button>
                    </div>
                    <select
                      className={selectCls}
                      value={secondStaffId}
                      onChange={(e) => setSecondStaffId(e.target.value)}
                    >
                      <option value="">— Chọn —</option>
                      {courseTeachers.map((t) => (
                        <option key={`s-${t.staffId}`} value={t.staffId}>
                          {t.displayName}
                          {t.isMain ? ' (chính)' : ' (phụ)'}
                        </option>
                      ))}
                    </select>
                    <label className="block text-xs font-bold text-gray-600">
                      Vai trò trong buổi (GV2)
                      <select
                        className={`${selectCls} mt-1`}
                        value={secondRole}
                        onChange={(e) => setSecondRole(e.target.value)}
                      >
                        {SESSION_ROLES.map((r) => (
                          <option key={`s2-${r.value}`} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {TA_OR_OB.includes(secondRole) && (
                      <label className="block text-xs font-bold text-gray-600">
                        Mức lương trợ giảng / dự giờ
                        <select
                          className={`${selectCls} mt-1`}
                          value={secondPayTier}
                          onChange={(e) => setSecondPayTier(e.target.value)}
                        >
                          {PAY_TIERS.map((r) => (
                            <option key={`pt2-${r.value}`} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Ghi chú (hiển thị trên ô)
              </label>
              <span
                className={`text-[10px] font-bold ${note.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-300'}`}
              >
                {note.length} / {MAX_LENGTH}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_LENGTH))}
              className="w-full h-28 px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-[#1C695C]/15 outline-none resize-none text-sm font-medium text-gray-700 placeholder:text-gray-300"
              placeholder="Nội dung hiển thị trên lịch…"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Màu nền ô
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-11 h-11 rounded-xl transition-all border-2 shadow-sm flex items-center justify-center ${
                    color === c ? 'border-[#1C695C] scale-110' : 'border-gray-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <HiCheck className={`${getContrastColor(c)} text-lg shadow-sm`} />
                  )}
                </button>
              ))}
              <div className="relative group">
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#E3F2FD'}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shadow-sm ${
                    !PRESET_COLORS.includes(color) ? 'border-[#1C695C] scale-110' : 'border-gray-100'
                  }`}
                  style={{
                    backgroundColor: PRESET_COLORS.includes(color) ? '#fff' : color
                  }}
                >
                  <HiPaintBrush
                    className={`text-lg ${
                      !PRESET_COLORS.includes(color) ? getContrastColor(color) : 'text-gray-300'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-dashed border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Xem trước
            </label>
            <div
              className="w-full min-h-[72px] rounded-2xl p-4 border border-black/5 shadow-inner flex items-center justify-center text-center"
              style={{ backgroundColor: previewBg }}
            >
              <p className={`text-sm font-black whitespace-pre-wrap ${textColorClass}`}>
                {note || 'Ô trống…'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving || !cell?._id}
            className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Xóa hoàn toàn ô thời khóa biểu này"
          >
            <HiTrash className="text-xl" />
          </button>

          <div className="flex-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] px-5 py-3 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: LUCY_BRAND.primary,
                boxShadow: `0 10px 24px ${LUCY_BRAND.primary}33`
              }}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </div>
              ) : (
                <>
                  <HiCheck className="text-xl" /> Lưu
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CellPopover;