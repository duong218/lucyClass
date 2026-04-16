import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../utils/getImageUrl';
import { showToast } from '../utils/toastUtils';
import ConfirmModal from '../components/common/ConfirmModal';
import PrimaryButton from '../components/common/PrimaryButton';

const AnnouncementManagement = () => {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState({ title: '', description: '', image: null });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const fileInputRef = useRef(null);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.data || []);
    } catch (error) {
      console.error('Lỗi tải thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (announcement = null) => {
    if (announcement) {
      setCurrentAnnouncement({ ...announcement, image: null });
      setPreviewUrl(getImageUrl(announcement.image));
      setIsEditing(true);
    } else {
      setCurrentAnnouncement({ title: '', description: '', image: null });
      setPreviewUrl('');
      setIsEditing(false);
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP)!');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('Dung lượng ảnh phải dưới 2MB!');
        return;
      }
      setCurrentAnnouncement({ ...currentAnnouncement, image: file });
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentAnnouncement.title.trim() || currentAnnouncement.title.trim().length > 100) {
      setError('Tiêu đề phải từ 1 đến 100 ký tự');
      return;
    }
    if (!isEditing && !currentAnnouncement.image) {
      setError('Vui lòng chọn hình ảnh cho thông báo!');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', currentAnnouncement.title.trim());
    formData.append('description', currentAnnouncement.description.trim());
    if (currentAnnouncement.image) formData.append('image', currentAnnouncement.image);

    try {
      if (isEditing) {
        await api.put(`/announcements/${currentAnnouncement._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast.success('Cập nhật thông báo thành công! ✨');
      } else {
        await api.post('/announcements', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast.success('Thêm thông báo mới thành công! 🎉');
      }
      setIsModalOpen(false);
      setError(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Lỗi lưu thông báo:', error);
      const msg = error.response?.data?.message || 'Lưu thông báo thất bại. Vui lòng thử lại.';
      setError(msg);
      showToast.error(`Lỗi: ${msg} 🛠️`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => setConfirmModal({ isOpen: true, id });

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await api.delete(`/announcements/${confirmModal.id}`);
      showToast.success('Đã xoá thông báo thành công! 🌪️');
      fetchAnnouncements();
    } catch (error) {
      console.error('Lỗi xoá thông báo:', error);
      showToast.error('Xoá thất bại. Vui lòng thử lại 😢');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  return (
    <div className="space-y-6 pb-10">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">📢 Quản lý thông báo</h1>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý các thông báo hiển thị trên trang chủ</p>
        </div>
        <button onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 text-sm whitespace-nowrap">
          + Thêm thông báo
        </button>
      </div>

      {/* Danh sách thông báo */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-medium animate-pulse">Đang tải...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((ann) => (
            <motion.div layout key={ann._id}
              className="bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-lg transition-all flex flex-col hover:-translate-y-1">
              <div className="h-44 overflow-hidden bg-gray-100 relative">
                <img src={getImageUrl(ann.image)} alt="" className="w-full h-full object-cover" onError={handleImageError} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-black text-gray-800 mb-2 truncate tracking-tight">{ann.title}</h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2 italic flex-1">{ann.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(ann)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all hover:-translate-y-0.5">
                    ✏️ Chỉnh sửa
                  </button>
                  <button onClick={() => handleDeleteClick(ann._id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all hover:-translate-y-0.5">
                    🗑️ Xoá
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {announcements.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 italic bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-bold">Chưa có thông báo nào. Hãy thêm thông báo đầu tiên!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal thêm/sửa */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-7 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-black mb-5 text-gray-800">
                {isEditing ? '✏️ Chỉnh sửa thông báo' : '➕ Thêm thông báo mới'}
              </h2>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold mb-5 border border-red-100 flex items-start gap-2">
                  <span>⚠️</span> {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Upload ảnh */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Hình ảnh (tối đa 2MB) {!isEditing && '*'}</label>
                  <div onClick={() => fileInputRef.current.click()}
                    className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-gray-100 hover:border-blue-300 transition-all overflow-hidden group">
                    {previewUrl ? (
                      <div className="relative">
                        <img src={previewUrl} alt="Xem trước" className="max-h-48 mx-auto rounded-lg shadow-sm" onError={handleImageError} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold rounded-lg transition-opacity">
                          🖼️ Đổi ảnh
                        </div>
                      </div>
                    ) : (
                      <div className="py-10">
                        <span className="text-4xl mb-3 block">🖼️</span>
                        <p className="text-sm text-gray-400 font-bold">Nhấn để tải ảnh lên</p>
                        <p className="text-[10px] text-gray-300 mt-1 uppercase">PNG, JPG, WEBP · Tối đa 2MB</p>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>

                {/* Tiêu đề */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tiêu đề *</label>
                    <span className={`text-[10px] font-bold ${currentAnnouncement.title.length > 90 ? 'text-red-500' : 'text-gray-400'}`}>
                      {currentAnnouncement.title.length}/100
                    </span>
                  </div>
                  <input type="text" required maxLength={100}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                    placeholder="Nhập tiêu đề thông báo"
                    value={currentAnnouncement.title}
                    onChange={(e) => { setCurrentAnnouncement({ ...currentAnnouncement, title: e.target.value }); if (error) setError(null); }}
                  />
                </div>

                {/* Mô tả */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nội dung *</label>
                    <span className={`text-[10px] font-bold ${(currentAnnouncement.description?.length || 0) > 650 ? 'text-red-500' : 'text-gray-400'}`}>
                      {currentAnnouncement.description?.length || 0}/700
                    </span>
                  </div>
                  <textarea required rows="5" maxLength={700}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all resize-none"
                    placeholder="Nhập nội dung chi tiết của thông báo..."
                    value={currentAnnouncement.description}
                    onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <PrimaryButton type="submit" isLoading={isSubmitting} className="flex-1 py-3.5 rounded-2xl font-bold">
                    {isEditing ? '💾 Cập nhật' : '➕ Đăng thông báo'}
                  </PrimaryButton>
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">
                    Huỷ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Xoá thông báo này?"
        message="Thông báo sẽ bị xoá vĩnh viễn và không thể khôi phục. Bạn chắc chắn chứ?"
      />
    </div>
  );
};

export default AnnouncementManagement;
