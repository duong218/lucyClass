import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../utils/toastUtils';
import ConfirmModal from '../components/common/ConfirmModal';
import api from '../services/api';

// ─────────────────────────────────────────────
// 🏅 Ranking Modal
// ─────────────────────────────────────────────
const TITLE_OPTIONS = [
  { value: 'Tiến bộ vượt bậc', emoji: '🚀' },
  { value: 'Phát âm tốt',       emoji: '🎤' },
  { value: 'Top Speaking',       emoji: '🗣️' },
  { value: 'Hoàn thành bài tập', emoji: '✅' },
  { value: 'Sáng tạo',           emoji: '✨' },
];

const RankingModal = ({ student, course, onClose, onSaved }) => {
  const [stars, setStars]   = useState('');
  const [title, setTitle]   = useState('');
  const [skill, setSkill]   = useState('');
  const [saving, setSaving] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  const handleSubmit = async () => {
    if (!stars || !title || !skill.trim()) {
      showToast.error('Vui lòng điền đầy đủ thông tin! 📝');
      return;
    }
    setSaving(true);
    try {
      await api.post('/rankings', {
        studentId:  student._id,
        courseId:   course?._id,
        childName:  student.childName,
        courseName: course?.name,
        stars:      Number(stars),
        title,
        skill:      skill.trim(),
      });
      showToast.success('Đã thêm vào bảng xếp hạng! 🏆');
      onSaved?.();
      onClose();
    } catch (err) {
      showToast.error(err?.message || 'Lỗi khi lưu xếp hạng 😢');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal card */}
        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden"
          initial={{ scale: 0.85, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-400 p-6 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Lên Bảng Xếp Hạng</h3>
                  <p className="text-yellow-100 text-xs font-medium">Ghi nhận thành tích tháng này</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Readonly fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Học Sinh</label>
                <p className="font-bold text-gray-800 text-sm truncate">{student.childName}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Khóa Học</label>
                <p className="font-bold text-gray-800 text-sm truncate">{course?.name || '—'}</p>
              </div>
            </div>

            {/* Stars - interactive */}
            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                ⭐ Số Sao Tháng Này
              </label>
              <div className="flex items-center gap-2">
                {[...Array(100)].slice(0, 10).map((_, i) => {
                  const val = (i + 1) * 10;
                  return null;
                })}
                {/* Numeric input with star display */}
                <div className="flex items-center gap-3 w-full">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={stars}
                    onChange={e => setStars(e.target.value)}
                    className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-2xl font-black text-amber-700 text-lg outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="0 – 100"
                  />
                  <div className="flex items-center gap-1 text-2xl flex-shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`cursor-pointer transition-transform hover:scale-125 select-none ${
                          stars && Number(stars) >= (i + 1) * 20 ? 'grayscale-0' : 'grayscale opacity-30'
                        }`}
                      >⭐</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Title select */}
            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                🎖️ Danh Hiệu Tháng Này
              </label>
              <div className="grid grid-cols-1 gap-2">
                {TITLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTitle(opt.value)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all text-left ${
                      title === opt.value
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill input */}
            <div>
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                💡 Kỹ Năng Nổi Bật
              </label>
              <input
                type="text"
                value={skill}
                onChange={e => setSkill(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                placeholder="vd: Pronunciation, Reading..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black shadow-lg shadow-amber-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>🏅 Xác Nhận</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// 📋 Main Component
// ─────────────────────────────────────────────
const CourseStudentList = () => {
    const { t } = useTranslation();
    const { courseId } = useParams();
    const navigate = useNavigate();
    
    const [students, setStudents]         = useState([]);
    const [course, setCourse]             = useState(null);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter]             = useState('all');
    const [showConfirm, setShowConfirm]   = useState(null);
    const [rankingStudent, setRankingStudent] = useState(null); // student to rank

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => { fetchData(); }, [courseId]);

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
            showToast.error('Lỗi khi tải dữ liệu 😢');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (studentId) => {
        setShowConfirm(null);
        const originalStudents = [...students];
        setStudents(prev => prev.map(s => s._id === studentId ? { ...s, isActive: false } : s));
        try {
            const res = await api.put(`/students/${studentId}/remove`);
            if (res.data.success) showToast.success('Đã cập nhật xong! 🎉');
            else throw new Error(res.data.message);
        } catch (error) {
            console.error('Remove failed:', error);
            setStudents(originalStudents);
            showToast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái 😢');
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch =
                student.childName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                student.parentName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                student.phone.includes(debouncedSearch);
            const matchesFilter =
                filter === 'all' ||
                (filter === 'active' && student.isActive) ||
                (filter === 'inactive' && !student.isActive);
            return matchesSearch && matchesFilter;
        });
    }, [students, debouncedSearch, filter]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <span className="text-4xl animate-bounce">⏳</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/students')}
                    className="p-3 bg-white border rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                >←</button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{course?.name || 'Khóa học'}</h1>
                    <p className="text-sm text-gray-400 capitalize">{t('admin.studentMgmt')} / {course?.ageGroup}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                {/* Search + filter */}
                <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder={t('admin.search')}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'active', 'inactive'].map(f => {
                            const labels = { all: 'Tất cả', active: 'Hoạt động', inactive: 'Đã nghỉ' };
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        filter === f
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                                >{labels[f]}</button>
                            );
                        })}
                    </div>
                </div>

                {/* Table */}
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
                                <th className="pb-4 px-4 text-center">Xếp Hạng</th>
                                <th className="pb-4 px-4 text-center">{t('admin.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-400">
                                        {t('admin.emptyStudents')}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s, i) => (
                                    <tr
                                        key={s._id}
                                        className={`hover:bg-gray-50/50 transition-colors ${!s.isActive ? 'bg-gray-50 italic opacity-80' : ''}`}
                                    >
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

                                        {/* ⭐ Ranking column */}
                                        <td className="py-5 px-4">
                                            <div className="flex justify-center">
                                                <motion.button
                                                    disabled={!s.isActive}
                                                    onClick={() => s.isActive && setRankingStudent(s)}
                                                    whileHover={s.isActive ? { scale: 1.3, rotate: 15 } : {}}
                                                    whileTap={s.isActive ? { scale: 0.9 } : {}}
                                                    className={`text-2xl transition-all ${
                                                        s.isActive
                                                            ? 'cursor-pointer drop-shadow-md hover:drop-shadow-lg'
                                                            : 'opacity-20 cursor-not-allowed grayscale'
                                                    }`}
                                                    title="Thêm vào bảng xếp hạng"
                                                >
                                                    ⭐
                                                </motion.button>
                                            </div>
                                        </td>

                                        {/* ❌ Remove column */}
                                        <td className="py-5 px-4">
                                            <div className="flex justify-center">
                                                <button
                                                    disabled={!s.isActive}
                                                    onClick={() => setShowConfirm(s)}
                                                    className={`p-2 rounded-xl transition-all ${
                                                        s.isActive
                                                            ? 'text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95'
                                                            : 'text-gray-300 cursor-not-allowed opacity-50'
                                                    }`}
                                                    title={t('admin.delete')}
                                                >❌</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirm remove modal */}
            <ConfirmModal
                isOpen={!!showConfirm}
                onClose={() => setShowConfirm(null)}
                onConfirm={() => handleRemove(showConfirm._id)}
                title={t('admin.confirm') || 'Chắc chắn xoá chứ?'}
                message={t('admin.removeConfirm') || 'Hành động này sẽ thay đổi trạng thái của học viên!'}
            />

            {/* Ranking modal */}
            {rankingStudent && (
                <RankingModal
                    student={rankingStudent}
                    course={course}
                    onClose={() => setRankingStudent(null)}
                    onSaved={() => {}}
                />
            )}
        </div>
    );
};

export default CourseStudentList;
