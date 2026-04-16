import { useState, useEffect } from 'react';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';
import ConfirmModal from '../components/common/ConfirmModal';
import PrimaryButton from '../components/common/PrimaryButton';
import { showToast } from '../utils/toastUtils';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', specialization: '', experience: '', description: '', feedback: '', rating: 5 });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const fetchData = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error('Lỗi tải danh sách giáo viên:', err);
      setTeachers([]);
    }
  };

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  useEffect(() => { fetchData(); }, []);

  const filtered = teachers.filter(tc =>
    !search || tc.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setFormData({ name: '', specialization: '', experience: '', description: '', feedback: '', rating: 5 });
    setAvatarFile(null);
    setAvatarPreview('');
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (tc) => {
    setEditing(tc);
    setFormData({
      name: tc.name,
      specialization: tc.specialization,
      experience: tc.experience,
      description: tc.description,
      feedback: tc.feedback ?? '',
      rating: tc.rating != null && tc.rating !== '' ? Number(tc.rating) : 5
    });
    setAvatarFile(null);
    setAvatarPreview(getImageUrl(tc.avatar));
    setErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Tên giáo viên là bắt buộc';
    else if (formData.name.length > 40) newErrors.name = 'Tối đa 40 ký tự';

    if (!formData.specialization) newErrors.specialization = 'Chuyên môn là bắt buộc';
    else if (formData.specialization.length > 100) newErrors.specialization = 'Tối đa 100 ký tự';

    const exp = parseInt(formData.experience);
    if (!formData.experience && formData.experience !== 0) newErrors.experience = 'Số năm kinh nghiệm là bắt buộc';
    else if (isNaN(exp) || exp < 1 || exp > 40) newErrors.experience = 'Phải từ 1 đến 40 năm';

    if (formData.description && formData.description.length > 50) newErrors.description = 'Tối đa 50 ký tự';
    if (formData.feedback && formData.feedback.length > 500) newErrors.feedback = 'Tối đa 500 ký tự';

    const ratingN = Number(formData.rating);
    if (!Number.isInteger(ratingN) || ratingN < 1 || ratingN > 5) newErrors.rating = 'Xếp hạng phải từ 1 đến 5';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      showToast.error('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB 📸');
      e.target.value = '';
      return;
    }
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, k === 'rating' ? String(v) : v));
    if (avatarFile) fd.append('avatar', avatarFile);
    try {
      if (editing) { await api.put(`/teachers/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      else { await api.post('/teachers', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      setShowForm(false);
      showToast.success(editing ? 'Cập nhật giáo viên thành công! 🎉' : 'Thêm giáo viên thành công! 🎉');
      fetchData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      showToast.error(`Lưu thất bại: ${msg} 🛠️`);
      setErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => setConfirmModal({ isOpen: true, id });

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await api.delete(`/teachers/${confirmModal.id}`);
      showToast.success('Đã xoá giáo viên thành công! ✨');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast.error('Xoá thất bại. Vui lòng thử lại 😢');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">👩‍🏫 Quản lý giáo viên</h2>
        <p className="text-sm text-gray-400 mt-0.5">Thêm, sửa hoặc xoá hồ sơ giáo viên của trung tâm</p>
      </div>

      {/* Thanh tìm kiếm & thêm mới */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm giáo viên theo tên..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm transition-colors" />
        </div>
        <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5">
          + Thêm giáo viên
        </button>
      </div>

      {/* Bảng giáo viên */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Ảnh đại diện', 'Họ tên', 'Chuyên môn', 'Kinh nghiệm', 'Xếp hạng', 'Hành động'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tc => (
                <tr key={tc._id} className="border-b last:border-0 hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                      {tc.avatar
                        ? <img src={getImageUrl(tc.avatar)} alt={tc.name} className="w-full h-full object-cover" onError={handleImageError} />
                        : <span className="text-xl">👩‍🏫</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{tc.name}</td>
                  <td className="px-4 py-3 text-gray-600">{tc.specialization}</td>
                  <td className="px-4 py-3">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-100">
                      {tc.experience} năm
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex text-amber-400 text-sm">
                      {'★'.repeat(tc.rating || 5)}{'☆'.repeat(5 - (tc.rating || 5))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(tc)} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all hover:-translate-y-0.5">✏️ Sửa</button>
                      <button onClick={() => handleDeleteClick(tc._id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-100 transition-all hover:-translate-y-0.5">🗑️ Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center py-12 text-gray-400 italic">Không tìm thấy giáo viên nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form thêm/sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-800 mb-5">
              {editing ? '✏️ Chỉnh sửa giáo viên' : '➕ Thêm giáo viên mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Họ và tên *</label>
                <input type="text" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value.slice(0, 40) })} required
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${errors.name ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                  placeholder="Ví dụ: Nguyễn Thị Lan" />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Chuyên môn *</label>
                  <input type="text" value={formData.specialization}
                    onChange={e => setFormData({ ...formData, specialization: e.target.value.slice(0, 100) })} required
                    className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${errors.specialization ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                    placeholder="Ví dụ: Tiếng Anh thiếu nhi" />
                  {errors.specialization && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.specialization}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Kinh nghiệm (năm) *</label>
                  <input type="number" value={formData.experience}
                    onChange={e => setFormData({ ...formData, experience: e.target.value })} required min="1" max="40"
                    className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${errors.experience ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                    placeholder="5" />
                  {errors.experience && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.experience}</p>}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mô tả ngắn</label>
                  <span className={`text-[10px] font-bold ${(formData.description?.length || 0) > 50 ? 'text-red-500' : 'text-gray-400'}`}>{formData.description?.length || 0}/50</span>
                </div>
                <textarea value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value.slice(0, 50) })} rows="2"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm resize-none transition-colors ${errors.description ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                  placeholder="Giáo viên vui tính, giàu kinh nghiệm..." />
                {errors.description && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.description}</p>}
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nhận xét từ học viên</label>
                  <span className={`text-[10px] font-bold ${(formData.feedback?.length || 0) > 500 ? 'text-red-500' : 'text-gray-400'}`}>{formData.feedback?.length || 0}/500</span>
                </div>
                <textarea value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value.slice(0, 500) })} rows="3"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm resize-none transition-colors ${errors.feedback ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                  placeholder="Nhận xét từ phụ huynh hoặc học viên (không bắt buộc)" />
                {errors.feedback && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.feedback}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Xếp hạng ⭐</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })}
                      className={`text-3xl leading-none transition-transform hover:scale-110 ${Number(formData.rating) >= star ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}>★</button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-gray-500">{Number(formData.rating) || 5}/5</span>
                </div>
                {errors.rating && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.rating}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Xem trước */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Xem trước</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="w-14 h-14 mx-auto mb-2 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                      {avatarPreview
                        ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" onError={handleImageError} />
                        : <span className="text-2xl">👩‍🏫</span>}
                    </div>
                    <p className="font-bold text-gray-800 text-sm">{formData.name || 'Họ tên'}</p>
                    <p className="text-xs text-blue-500 font-semibold">{formData.specialization || 'Chuyên môn'}</p>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{formData.description || 'Mô tả'}</p>
                  </div>
                </div>
                {/* Upload ảnh */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Ảnh đại diện</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-blue-300 transition-colors">
                    {avatarPreview && (
                      <img src={avatarPreview} alt="" className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" onError={handleImageError} />
                    )}
                    <label className="cursor-pointer inline-block">
                      <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">📤 Chọn ảnh</div>
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                    <p className="text-[10px] text-gray-400 mt-1">Tối đa 5MB</p>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-red-600 text-xs font-bold">⚠️ {errors.submit}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <PrimaryButton type="submit" isLoading={isSubmitting} variant="success" className="flex-1">
                  {editing ? '💾 Lưu thay đổi' : '➕ Thêm giáo viên'}
                </PrimaryButton>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold hover:bg-gray-200 text-sm transition-all">
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Xoá giáo viên này?"
        message="Hồ sơ giáo viên sẽ bị xoá vĩnh viễn và không thể khôi phục. Bạn chắc chắn chứ?"
      />
    </div>
  );
};

export default TeacherManagement;
