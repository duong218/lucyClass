import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAllAnnouncements,
  getPendingAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../services/announcementService';
import { getImageUrl } from '../utils/getImageUrl';
import { showToast } from '../utils/toastUtils';
import AnnouncementReviewModal from '../components/AnnouncementReviewModal';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TAB_PUBLISHED = 'published';
const TAB_PENDING   = 'pending';

// ─── Animation variants ─────────────────────────────────────────────────────
const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' } }),
  exit:    { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

const AnnouncementManagement = () => {
  const { t } = useTranslation();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(TAB_PUBLISHED);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState([]);
  const [pendingList, setPendingList]     = useState([]);
  const [loading, setLoading]             = useState(false);

  // ── Form (create / edit) ───────────────────────────────────────────────────
  const [form, setForm]           = useState({ title: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // ── Review modal ───────────────────────────────────────────────────────────
  const [reviewTarget, setReviewTarget] = useState(null);

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch published ────────────────────────────────────────────────────────
  const fetchPublished = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllAnnouncements();
      setAnnouncements(res.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  // ─── Fetch pending ──────────────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPendingAnnouncements();
      setPendingList(res.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPublished();
    fetchPending();
  }, [fetchPublished, fetchPending]);

  // Lắng nghe event từ NotificationBell khi admin bấm "Xem & duyệt ngay"
  useEffect(() => {
    const handler = () => setActiveTab(TAB_PENDING);
    window.addEventListener('announcement:open-pending', handler);
    return () => window.removeEventListener('announcement:open-pending', handler);
  }, []);

  // Lắng nghe event sau khi review xong từ bất kỳ nơi nào
  useEffect(() => {
    const handler = () => { fetchPublished(); fetchPending(); };
    window.addEventListener('announcement:reviewed', handler);
    return () => window.removeEventListener('announcement:reviewed', handler);
  }, [fetchPublished, fetchPending]);

  // ─── Xử lý form ─────────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({ title: '', description: '' });
    setImageFile(null);
    setImagePreview('');
    setEditingId(null);
    setFormError('');
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({ title: item.title, description: item.description });
    setImagePreview(getImageUrl(item.image));
    setImageFile(null);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim())       return setFormError('Tiêu đề không được để trống');
    if (!form.description.trim()) return setFormError('Nội dung không được để trống');
    if (!editingId && !imageFile) return setFormError('Vui lòng chọn ảnh');

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    if (imageFile) fd.append('image', imageFile);

    setSubmitting(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, fd);
        showToast.success('Cập nhật thông báo thành công!');
      } else {
        await createAnnouncement(fd);
        showToast.success('Đăng thông báo thành công!');
      }
      resetForm();
      fetchPublished();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      setFormError(msg);
      showToast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(deleteTarget);
      showToast.success('Đã xoá thông báo thành công!');
      fetchPublished();
    } catch {
      showToast.error('Xoá thất bại, vui lòng thử lại.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ─── Sau khi review modal duyệt / từ chối ────────────────────────────────
  const handleReviewed = (id, action) => {
    setPendingList(prev => prev.filter(a => a._id !== id));
    if (action === 'approve') fetchPublished();
  };

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-2xl shrink-0">
          📢
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-tight">
            Quản lý thông báo
          </h1>
          <p className="text-sm text-gray-400 font-medium">Tạo, chỉnh sửa và duyệt thông báo hiển thị trên website</p>
        </div>
      </div>

      {/* ── Create / Edit form ────────────────────────────────────────────── */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-3xl shadow-card border border-gray-100 p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{editingId ? '✏️' : '➕'}</span>
          <h2 className="text-base font-black text-gray-700 uppercase tracking-wide">
            {editingId ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
          </h2>
        </div>

        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-semibold flex items-center gap-2"
            >
              <span>⚠️</span> {formError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tiêu đề */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1.5">
            Tiêu đề <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormError(''); }}
            maxLength={1000}
            placeholder="Nhập tiêu đề thông báo..."
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all placeholder:text-gray-400"
          />
          <p className="text-right text-[10px] text-gray-400 mt-1">{form.title.length}/1000</p>
        </div>

        {/* Nội dung */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1.5">
            Nội dung <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFormError(''); }}
            rows={4}
            maxLength={7000}
            placeholder="Nhập nội dung thông báo..."
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all placeholder:text-gray-400"
          />
          <p className="text-right text-[10px] text-gray-400 mt-1">{form.description.length}/7000</p>
        </div>

        {/* Ảnh upload */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1.5">
            Ảnh {!editingId && <span className="text-red-400">* (bắt buộc)</span>}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-primary-50/30 transition-all group cursor-pointer"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">🖼️</span>
              <span className="text-sm text-gray-400 font-semibold group-hover:text-primary-500 transition-colors">
                Nhấn để chọn ảnh
              </span>
            </button>
          ) : (
            <div className="relative group w-40 h-28 rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-primary-400 transition-all">
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); }}
                className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black transition-all opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full">Đổi ảnh</span>
              </button>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-3 bg-primary-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary-600 hover:shadow-card-hover transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? '⏳ Đang lưu...' : editingId ? '💾 Cập nhật' : '📤 Đăng thông báo'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-7 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
            >
              Huỷ
            </button>
          )}
        </div>
      </motion.form>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5">
        <button
          onClick={() => setActiveTab(TAB_PUBLISHED)}
          className={`flex-1 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === TAB_PUBLISHED
              ? 'bg-white shadow-sm text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✅ Đã đăng ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab(TAB_PENDING)}
          className={`relative flex-1 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === TAB_PENDING
              ? 'bg-white shadow-sm text-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ⏳ Chờ duyệt
          {pendingList.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
              {pendingList.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Published ───────────────────────────────────────────────── */}
      {activeTab === TAB_PUBLISHED && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Đang tải...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-5xl">📭</span>
              <p className="text-sm text-gray-400 font-semibold">Chưa có thông báo nào</p>
              <p className="text-xs text-gray-300">Tạo thông báo đầu tiên ở form phía trên</p>
            </div>
          ) : (
            <AnimatePresence>
              {announcements.map((item, i) => (
                <motion.div
                  key={item._id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-card hover:border-primary-100 transition-all group"
                >
                  <div className="w-24 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(item.image)} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                      <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight truncate group-hover:text-primary-600 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{item.description}</p>
                    <span className="text-[10px] text-gray-400 mt-1.5 inline-block font-semibold">
                      📅 {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 justify-center">
                    <button
                      onClick={() => startEdit(item)}
                      className="px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-xs font-bold hover:bg-primary-100 transition-all active:scale-95"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item._id)}
                      className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-all active:scale-95"
                    >
                      🗑️ Xoá
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* ── Tab: Pending ─────────────────────────────────────────────────── */}
      {activeTab === TAB_PENDING && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Đang tải...</p>
            </div>
          ) : pendingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-5xl">🎉</span>
              <p className="text-sm text-gray-400 font-semibold">Không có thông báo nào đang chờ duyệt</p>
              <p className="text-xs text-gray-300">Tuyệt vời! Mọi thứ đã được xử lý</p>
            </div>
          ) : (
            <AnimatePresence>
              {pendingList.map((item, i) => (
                <motion.div
                  key={item._id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="flex gap-4 bg-amber-50/70 rounded-2xl border border-amber-200 p-4 hover:shadow-card hover:border-amber-300 transition-all cursor-pointer group"
                  onClick={() => setReviewTarget(item)}
                >
                  <div className="w-24 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(item.image)} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-black bg-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                        ⏳ Chờ duyệt
                      </span>
                      {item.submittedBy && (
                        <span className="text-[10px] text-violet-500 font-bold flex items-center gap-1">
                          👤 {item.submittedBy.displayName || item.submittedBy.username}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight truncate group-hover:text-amber-700 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{item.description}</p>
                    <span className="text-[10px] text-gray-400 mt-1.5 inline-block font-semibold">
                      📅 {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 justify-center">
                    <button
                      onClick={e => { e.stopPropagation(); setReviewTarget(item); }}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-sm"
                    >
                      👁️ Duyệt
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <span className="text-5xl block">🗑️</span>
              <h3 className="text-lg font-black text-gray-800">Xoá thông báo?</h3>
              <p className="text-sm text-gray-500">Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xoá?</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-5 py-2.5 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deleting ? '⏳ Đang xoá...' : '🗑️ Xoá'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Review Modal ─────────────────────────────────────────────────── */}
      <AnnouncementReviewModal
        announcement={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onReviewed={(id, action) => {
          setReviewTarget(null);
          handleReviewed(id, action);
          window.dispatchEvent(new CustomEvent('announcement:reviewed', { detail: { id, action } }));
        }}
      />
    </div>
  );
};

export default AnnouncementManagement;
