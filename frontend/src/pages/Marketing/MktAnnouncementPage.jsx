import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { submitAnnouncement, getMySubmissions } from '../../services/announcementService';
import { getImageUrl } from '../../utils/getImageUrl';
import { showToast } from '../../utils/toastUtils';

const MKT_DAILY_LIMIT = 5;

// ─── Status badge config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: '⏳ Chờ duyệt',  bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200' },
  published: { label: '✅ Đã duyệt',   bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected:  { label: '❌ Từ chối',     bg: 'bg-red-100',     text: 'text-red-600',     border: 'border-red-200' },
};

// ─── Animation variants ─────────────────────────────────────────────────────
const cardVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

/**
 * MktAnnouncementPage
 * Trang đăng thông báo dành riêng cho role marketing.
 */
const MktAnnouncementPage = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [form, setForm]                   = useState({ title: '', description: '' });
  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState('');
  const [imageMeta, setImageMeta]         = useState(null);
  const [formError, setFormError]         = useState('');
  const [successMsg, setSuccessMsg]       = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [lightboxOpen, setLightboxOpen]   = useState(false);
  const [isDragging, setIsDragging]       = useState(false);

  // ── Lịch sử submission ────────────────────────────────────────────────────
  const [myHistory, setMyHistory]           = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchMyHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await getMySubmissions();
      setMyHistory(res.data?.data || []);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { fetchMyHistory(); }, [fetchMyHistory]);

  // Đếm số bài gửi hôm nay (TẤT CẢ status đều tính)
  const todayCount = myHistory.filter(a => {
    const d = new Date(a.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const remainingSlots = Math.max(0, MKT_DAILY_LIMIT - todayCount);

  // ── Image handler ──────────────────────────────────────────────────────────
  const processImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreview(dataUrl);
      const img = new Image();
      img.onload = () => {
        setImageMeta({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          w: img.naturalWidth,
          h: img.naturalHeight,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageMeta(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!form.title.trim())       return setFormError('Tiêu đề không được để trống');
    if (!form.description.trim()) return setFormError('Nội dung không được để trống');
    if (!imageFile)               return setFormError('Vui lòng chọn ảnh — ảnh là bắt buộc khi đăng thông báo');

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('image', imageFile);

    setSubmitting(true);
    try {
      await submitAnnouncement(fd);
      showToast.success('Đã gửi thông báo! Admin sẽ duyệt sớm.');
      setSuccessMsg('✅ Đã gửi thông báo! Admin sẽ duyệt và thông báo kết quả cho bạn.');
      setForm({ title: '', description: '' });
      clearImage();
      fetchMyHistory(); // Refresh lịch sử
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '';
      if (msg.includes('5') || err?.response?.status === 429) {
        const errorMsg = `Bạn đã đạt giới hạn ${MKT_DAILY_LIMIT} thông báo/ngày. Vui lòng thử lại vào ngày mai.`;
        setFormError(errorMsg);
        showToast.error(errorMsg);
      } else {
        setFormError(msg || 'Có lỗi xảy ra, vui lòng thử lại.');
        showToast.error(msg || 'Gửi thất bại, vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl shrink-0">
          📢
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-tight">
            Đăng thông báo
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Thông báo sẽ được gửi đến admin để duyệt trước khi hiển thị.
          </p>
        </div>
      </motion.div>

      {/* ── Quota info ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
          remainingSlots === 0
            ? 'bg-red-50 border-red-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
          remainingSlots === 0 ? 'bg-red-100' : 'bg-emerald-100'
        }`}>
          {remainingSlots === 0 ? '🚫' : '📊'}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${remainingSlots === 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {remainingSlots === 0
              ? `Bạn đã gửi đủ ${MKT_DAILY_LIMIT} thông báo hôm nay.`
              : `Hôm nay bạn còn ${remainingSlots} / ${MKT_DAILY_LIMIT} lượt gửi.`}
          </p>
          <p className={`text-xs mt-0.5 ${remainingSlots === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            Mỗi lần gửi đều tính 1 lượt (kể cả bị từ chối). Reset lúc 0:00.
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {Array.from({ length: MKT_DAILY_LIMIT }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < todayCount
                  ? 'bg-gray-300'
                  : remainingSlots === 0 ? 'bg-red-300' : 'bg-emerald-400'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-white rounded-3xl shadow-card border border-gray-100 p-6 sm:p-8 space-y-5"
      >
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm font-semibold text-emerald-700 flex items-center gap-2"
            >
              <span className="text-lg">🎉</span> {successMsg}
            </motion.div>
          )}
          {formError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm font-semibold text-red-600 flex items-center gap-2"
            >
              <span className="text-lg">⚠️</span> {formError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tiêu đề */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Tiêu đề <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormError(''); setSuccessMsg(''); }}
            maxLength={1000}
            placeholder="Nhập tiêu đề thông báo..."
            disabled={remainingSlots === 0}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 disabled:opacity-50 disabled:bg-gray-50 transition-all placeholder:text-gray-400"
          />
          <p className="text-right text-[10px] text-gray-400 mt-1">{form.title.length}/1000</p>
        </div>

        {/* Nội dung */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Nội dung <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFormError(''); setSuccessMsg(''); }}
            rows={5}
            maxLength={7000}
            placeholder="Nhập nội dung thông báo..."
            disabled={remainingSlots === 0}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 disabled:opacity-50 disabled:bg-gray-50 transition-all placeholder:text-gray-400"
          />
          <p className="text-right text-[10px] text-gray-400 mt-1">{form.description.length}/7000</p>
        </div>

        {/* Ảnh — drag & drop */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Ảnh <span className="text-red-400">* (bắt buộc)</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={remainingSlots === 0}
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => remainingSlots > 0 && fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-2xl py-10 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                isDragging
                  ? 'border-violet-400 bg-violet-50/50 scale-[1.01]'
                  : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50/30'
              } ${remainingSlots === 0 ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <span className="text-4xl">🖼️</span>
              <div className="text-center">
                <p className="text-sm text-gray-500 font-semibold">
                  Kéo thả ảnh vào đây hoặc <span className="text-violet-500 font-bold">chọn file</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — tối đa 5MB</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 items-start"
            >
              <div
                className="relative group/img w-28 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-violet-400 cursor-zoom-in shrink-0 transition-all"
                onClick={() => setLightboxOpen(true)}
              >
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-all opacity-0 group-hover/img:opacity-100">
                  <span className="text-white text-xs font-bold bg-black/40 px-2 py-1 rounded-full">🔍 Xem</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {imageMeta && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-bold text-gray-700 truncate">{imageMeta.name}</p>
                    <p>📐 {imageMeta.w} × {imageMeta.h} px</p>
                    <p>💾 {imageMeta.size}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-violet-500 font-bold hover:underline">Đổi ảnh</button>
                  <button type="button" onClick={clearImage} className="text-xs text-red-400 font-bold hover:underline">Xoá ảnh</button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || remainingSlots === 0}
          className="w-full px-6 py-3.5 bg-violet-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-violet-700 hover:shadow-card-hover transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? '⏳ Đang gửi...' : '📤 Gửi thông báo để duyệt'}
        </button>
      </motion.form>

      {/* ── Lịch sử gửi thông báo ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h2 className="text-base font-black text-gray-700 uppercase tracking-wide">
            Lịch sử gửi thông báo
          </h2>
          <span className="text-xs text-gray-400 font-medium">({myHistory.length})</span>
        </div>

        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-7 h-7 border-3 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Đang tải...</p>
          </div>
        ) : myHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 bg-white rounded-3xl border border-gray-100">
            <span className="text-4xl">📭</span>
            <p className="text-sm text-gray-400 font-semibold">Bạn chưa gửi thông báo nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myHistory.map((item, i) => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
              return (
                <motion.div
                  key={item._id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className={`bg-white rounded-2xl border p-4 transition-all ${
                    item.status === 'rejected' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  {/* Lý do từ chối — chỉ hiện khi rejected */}
                  {item.status === 'rejected' && item.reviewNote && (
                    <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs font-bold text-red-600 mb-0.5">💬 Lý do từ chối:</p>
                      <p className="text-sm text-red-700 leading-relaxed">{item.reviewNote}</p>
                      {item.reviewedBy && (
                        <p className="text-[10px] text-red-400 mt-1 font-semibold">
                          — {item.reviewedBy.displayName || item.reviewedBy.username}
                          {item.reviewedAt && ` • ${new Date(item.reviewedAt).toLocaleDateString('vi-VN')}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Thông tin duyệt — chỉ hiện khi published */}
                  {item.status === 'published' && item.reviewedBy && (
                    <div className="mt-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-xs text-emerald-600 font-semibold">
                        ✅ Đã được duyệt bởi {item.reviewedBy.displayName || item.reviewedBy.username}
                        {item.reviewedAt && ` • ${new Date(item.reviewedAt).toLocaleDateString('vi-VN')}`}
                      </p>
                      {item.reviewNote && (
                        <p className="text-xs text-emerald-500 mt-0.5">💬 {item.reviewNote}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 cursor-zoom-out p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              src={imagePreview}
              alt="full preview"
              className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 right-5 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full text-white font-black text-lg flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MktAnnouncementPage;