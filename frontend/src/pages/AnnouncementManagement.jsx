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
  const [currentAnnouncement, setCurrentAnnouncement] = useState({
    title: '',
    description: '',
    image: null
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      // Handle standardized response { success: true, data: [...] }
      setAnnouncements(res.data.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (announcement = null) => {
    if (announcement) {
      setCurrentAnnouncement({
        ...announcement,
        image: null
      });
      const existingImage = announcement.image;
      setPreviewUrl(getImageUrl(existingImage));
      setIsEditing(true);
    } else {
      setCurrentAnnouncement({ title: '', description: '', image: null });
      setPreviewUrl('');
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn tệp hình ảnh!');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Dung lượng ảnh phải dưới 2MB!');
        return;
      }
      setCurrentAnnouncement({ ...currentAnnouncement, image: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentAnnouncement.title.trim() || currentAnnouncement.title.trim().length > 100) {
      setError('Tiêu đề phải từ 1 đến 100 ký tự');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', currentAnnouncement.title.trim());
    formData.append('description', currentAnnouncement.description.trim());
    if (currentAnnouncement.image) {
      formData.append('image', currentAnnouncement.image);
    }

    try {
      if (isEditing) {
        await api.put(`/announcements/${currentAnnouncement._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast.success('Cập nhật thông báo hoàn tất! ✨');
      } else {
        if (!currentAnnouncement.image) {
          setError('Vui lòng chọn hình ảnh!');
          setIsSubmitting(false);
          return;
        }
        await api.post('/announcements', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast.success('Tadaa! Thêm thông báo thành công! 🎉');
      }
      setIsModalOpen(false);
      setError(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      const msg = error.response?.data?.message || 'Lỗi khi lưu thông báo';
      setError(msg);
      showToast.error('Úi, thử lại sau nhé! 🛠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await api.delete(`/announcements/${confirmModal.id}`);
      showToast.success('Đã xoá thông báo! 🌪️');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showToast.error('Ôi hỏng! Có lỗi xảy ra mất rồi 😢');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('announcements.manage_title')}</h1>
          <p className="text-gray-500 text-sm">Manage what's new on the home page</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary-200"
        >
          + Add New
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((ann) => (
            <motion.div 
              layout
              key={ann._id}
              className="bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-md transition-all flex flex-col"
            >
              <div className="h-40 overflow-hidden bg-gray-100">
                <img 
                  src={getImageUrl(ann.image)} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  onError={handleImageError}
                />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 mb-2 truncate uppercase tracking-tight">{ann.title}</h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2 italic flex-1">{ann.description}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(ann)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 hover:-translate-y-0.5 hover:shadow-button transition-all"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(ann._id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold hover:bg-red-100 hover:-translate-y-0.5 hover:shadow-button transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {announcements.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 italic bg-gray-50 rounded-3xl">
              No announcements found. Add your first one!
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-6 text-gray-800">{isEditing ? 'Edit Announcement' : 'Add New Announcement'}</h2>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold mb-6 border border-red-100 flex items-center gap-2"
                >
                  <span className="text-sm">⚠️</span> {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Image (Max 2MB)</label>
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-gray-100 hover:border-primary-300 transition-all overflow-hidden group"
                  >
                     {previewUrl ? (
                       <div className="relative">
                         <img 
                           src={previewUrl} 
                           alt="Preview" 
                           className="max-h-48 mx-auto rounded-lg shadow-sm" 
                           onError={handleImageError}
                         />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold rounded-lg transition-opacity">
                          Change Image
                        </div>
                      </div>
                    ) : (
                      <div className="py-10">
                        <span className="text-4xl mb-3 block">🖼️</span>
                        <p className="text-xs text-gray-400 font-bold">Click to upload image</p>
                        <p className="text-[10px] text-gray-300 mt-1 uppercase">PNG, JPG, WEBP</p>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Title</label>
                  <input 
                    type="text" 
                    required
                    maxLength={100}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                    placeholder="Enter announcement title"
                    value={currentAnnouncement.title}
                    onChange={(e) => {
                      setCurrentAnnouncement({...currentAnnouncement, title: e.target.value});
                      if (error) setError(null);
                    }}
                  />
                  <div className="flex justify-between mt-1 px-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Must be under 100 chars</p>
                    <p className={`text-[10px] font-bold ${currentAnnouncement.title.length > 90 ? 'text-red-500' : 'text-gray-400'}`}>
                      {currentAnnouncement.title.length}/100
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Description</label>
                  <textarea 
                    required
                    rows="5"
                    maxLength={700}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all resize-none"
                    placeholder="Enter details..."
                    value={currentAnnouncement.description}
                    onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <PrimaryButton 
                    type="submit"
                    isLoading={isSubmitting}
                    className="flex-1 py-3.5 rounded-2xl font-bold"
                  >
                    {isEditing ? 'Update' : 'Create'}
                  </PrimaryButton>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-button"
                  >
                    Cancel
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
        title="Xoá thông báo này? 🤔"
        message="Thông báo này sẽ biến mất và không thể lấy lại được đâu nhé! 🌪️"
      />
    </div>
  );
};

export default AnnouncementManagement;
