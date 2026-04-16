import { useState, useEffect } from 'react';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ parentName: '', childName: '', childAge: '', rating: 5, text: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchData = async () => {
    try {
      const res = await api.get('/feedback');
      setFeedbacks(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error('Lỗi tải nhận xét:', err);
      setFeedbacks([]);
    }
  };

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  useEffect(() => { fetchData(); }, []);

  const filtered = feedbacks.filter(fb =>
    !search || fb.parentName.toLowerCase().includes(search.toLowerCase()) || fb.childName.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setFormData({ parentName: '', childName: '', childAge: '', rating: 5, text: '' });
    setPhotoFile(null); setPhotoPreview(''); setErrors({});
    setShowForm(true);
  };

  const openEdit = (fb) => {
    setEditing(fb);
    setFormData({ parentName: fb.parentName, childName: fb.childName, childAge: fb.childAge || '', rating: fb.rating, text: fb.text });
    setPhotoFile(null); setPhotoPreview(getImageUrl(fb.photo)); setErrors({});
    setShowForm(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.parentName.trim()) newErrors.parentName = 'Tên phụ huynh là bắt buộc';
    else if (formData.parentName.length > 32) newErrors.parentName = 'Tối đa 32 ký tự';

    if (!formData.childName.trim()) newErrors.childName = 'Tên học sinh là bắt buộc';
    else if (formData.childName.length > 32) newErrors.childName = 'Tối đa 32 ký tự';

    const age = parseInt(formData.childAge);
    if (!formData.childAge) newErrors.childAge = 'Tuổi là bắt buộc';
    else if (age < 4 || age > 16) newErrors.childAge = 'Tuổi phải từ 4 đến 16';

    if (!formData.text.trim()) newErrors.text = 'Nội dung nhận xét là bắt buộc';
    else if (formData.text.length > 200) newErrors.text = 'Tối đa 200 ký tự';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    if (photoFile) fd.append('photo', photoFile);
    try {
      if (editing) { await api.put(`/feedback/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      else { await api.post('/feedback', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setErrors({ submit: msg });
    }
  };

  const deleteFeedback = async () => {
    try {
      await api.delete(`/feedback/${deleteConfirm}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">💬 Quản lý nhận xét phụ huynh</h2>
        <p className="text-sm text-gray-400 mt-0.5">Quản lý các nhận xét và đánh giá từ phụ huynh học viên</p>
      </div>

      {/* Thanh lọc */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên phụ huynh hoặc học sinh..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm transition-colors" />
        </div>
        <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5">
          + Thêm nhận xét
        </button>
      </div>

      {/* Bảng nhận xét */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Ảnh', 'Phụ huynh', 'Học sinh', 'Tuổi', 'Đánh giá', 'Nội dung nhận xét', 'Hành động'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(fb => (
                <tr key={fb._id} className="border-b last:border-0 hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {fb.photo
                        ? <img src={getImageUrl(fb.photo)} alt="" className="w-full h-full object-cover" onError={handleImageError} />
                        : <span className="text-xl">👤</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{fb.parentName}</td>
                  <td className="px-4 py-3 text-gray-600">{fb.childName}</td>
                  <td className="px-4 py-3 text-gray-600">{fb.childAge} tuổi</td>
                  <td className="px-4 py-3">
                    <div className="flex text-amber-400 text-sm">
                      {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-gray-600 line-clamp-2 italic text-xs">"{fb.text}"</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(fb)} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all">✏️ Sửa</button>
                      <button onClick={() => setDeleteConfirm(fb._id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-100 transition-all">🗑️ Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center py-12 text-gray-400 italic">Chưa có nhận xét nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form thêm/sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-800 mb-5">
              {editing ? '✏️ Chỉnh sửa nhận xét' : '➕ Thêm nhận xét mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Tên phụ huynh *</label>
                <input type="text" value={formData.parentName} maxLength={32}
                  onChange={e => setFormData({ ...formData, parentName: e.target.value })} required
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${errors.parentName ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                  placeholder="Ví dụ: Nguyễn Văn A" />
                {errors.parentName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.parentName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Tên học sinh *</label>
                  <input type="text" value={formData.childName} maxLength={32}
                    onChange={e => setFormData({ ...formData, childName: e.target.value })} required
                    className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${errors.childName ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                    placeholder="Tên bé" />
                  {errors.childName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.childName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Tuổi *</label>
                  <input type="number" value={formData.childAge} min="4" max="16"
                    onChange={e => setFormData({ ...formData, childAge: e.target.value })} required
                    className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${errors.childAge ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                    placeholder="8" />
                  {errors.childAge && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.childAge}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Xếp hạng (1–5 sao)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })}
                      className={`text-2xl transition-transform hover:scale-110 ${star <= formData.rating ? 'text-amber-400' : 'text-gray-300'}`}>★</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nội dung nhận xét *</label>
                  <span className={`text-[10px] font-bold ${formData.text.length > 180 ? 'text-red-500' : 'text-gray-400'}`}>{formData.text.length}/200</span>
                </div>
                <textarea value={formData.text} maxLength={200}
                  onChange={e => setFormData({ ...formData, text: e.target.value })} required rows="3"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm resize-none transition-colors ${errors.text ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                  placeholder="Nhận xét của phụ huynh về khoá học, giáo viên..." />
                {errors.text && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.text}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Ảnh phụ huynh (không bắt buộc)</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {photoPreview
                      ? <img src={photoPreview} alt="" className="w-full h-full object-cover" onError={handleImageError} />
                      : <span className="text-2xl">👤</span>}
                  </div>
                  <label className="cursor-pointer">
                    <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">📤 Tải ảnh lên</div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-red-600 text-xs font-bold">⚠️ {errors.submit}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-600 text-sm transition-all">
                  {editing ? '💾 Lưu thay đổi' : '➕ Thêm nhận xét'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold hover:bg-gray-200 text-sm transition-all">
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận xoá */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-black text-gray-800 mb-2">Xoá nhận xét này?</h3>
            <p className="text-sm text-gray-500 mb-6">Nhận xét sẽ bị xoá vĩnh viễn và không thể khôi phục.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all">Huỷ</button>
              <button onClick={deleteFeedback} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold hover:bg-red-600 transition-all">🗑️ Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
