import { useState, useEffect } from 'react';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';
import ConfirmModal from '../components/common/ConfirmModal';
import PrimaryButton from '../components/common/PrimaryButton';
import { showToast } from '../utils/toastUtils';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '', ageGroup: '', duration: '', classSize: '',
    description: '', highlights: '', teacher: '', additionalTeachers: []
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const fetchData = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        api.get('/courses'),
        api.get('/teachers')
      ]);
      setCourses(Array.isArray(cRes.data.data) ? cRes.data.data : []);
      setTeachers(Array.isArray(tRes.data.data) ? tRes.data.data : []);
    } catch (err) {
      console.error('Failed to fetch management data:', err);
      setCourses([]);
      setTeachers([]);
    }
  };

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setFormData({ name: '', ageGroup: '', duration: '', classSize: '', description: '', highlights: '', teacher: '', additionalTeachers: [] });
    setImageFile(null);
    setImagePreview('');
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setFormData({
      name: c.name,
      ageGroup: c.ageGroup,
      duration: c.duration,
      classSize: c.classSize?.toString() || '',
      description: c.description,
      highlights: c.highlights?.join(', ') || '',
      teacher: c.teacher?._id || '',
      additionalTeachers: c.additionalTeachers?.map(t => t._id || t) || []
    });
    setImageFile(null);
    setImagePreview(getImageUrl(c.image));
    setErrors({});
    setShowForm(true);
  };

  // Toggle chọn/bỏ giáo viên phụ
  const toggleAdditionalTeacher = (teacherId) => {
    setFormData(prev => {
      const current = prev.additionalTeachers;
      if (current.includes(teacherId)) {
        return { ...prev, additionalTeachers: current.filter(id => id !== teacherId) };
      }
      if (current.length >= 4) {
        showToast.error('Tối đa 4 giáo viên phụ thôi nhé! 🙈');
        return prev;
      }
      return { ...prev, additionalTeachers: [...current, teacherId] };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Course name is required';
    else if (formData.name.length > 40) newErrors.name = 'Max 40 characters';

    if (!formData.ageGroup) newErrors.ageGroup = 'Age group is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';

    const size = parseInt(formData.classSize);
    if (!formData.classSize) newErrors.classSize = 'Class size is required';
    else if (isNaN(size) || size < 1 || size > 100) newErrors.classSize = 'Range 1 - 100';

    if (formData.highlights) {
      const items = formData.highlights.split(',').map(h => h.trim()).filter(Boolean);
      if (items.some(h => h.length > 40)) newErrors.highlights = 'Each highlight max 40 characters';
    }

    if (formData.additionalTeachers.length > 4) {
      newErrors.additionalTeachers = 'Maximum 4 additional teachers';
    }

    // GV phụ không được trùng GV chính
    if (formData.teacher && formData.additionalTeachers.includes(formData.teacher)) {
      newErrors.additionalTeachers = 'Giáo viên phụ không được trùng giáo viên chính';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) { const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result); reader.readAsDataURL(file); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (k === 'teacher' && !v) return;
      if (k === 'highlights' && typeof v === 'string') {
        const arr = v.split(',').map(h => h.trim()).filter(Boolean);
        arr.forEach(item => fd.append('highlights', item));
      } else if (k === 'additionalTeachers') {
        // Gửi mảng: mỗi ID append riêng. Nếu rỗng gửi chuỗi rỗng để backend biết xóa hết
        if (Array.isArray(v) && v.length > 0) {
          v.forEach(id => fd.append('additionalTeachers', id));
        } else {
          fd.append('additionalTeachers', '');
        }
      } else {
        fd.append(k, v);
      }
    });

    if (imageFile) fd.append('image', imageFile);

    try {
      if (editing) {
        await api.put(`/courses/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/courses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowForm(false);
      showToast.success('Tadaa! Lưu thành công rồi nhé! 🎉');
      fetchData();
    } catch (err) {
      console.error("Course Operation Failed:", err.response?.data || err);
      showToast.error('Úi, xui quá, thử lại lần nữa xem sao! 🛠️');
      setErrors({ submit: err.response?.data?.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => { setConfirmModal({ isOpen: true, id }); };

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await api.delete(`/courses/${confirmModal.id}`);
      showToast.success('Tuyệt vời! Xoá xong xuôi! ✨');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast.error('Ôi hỏng! Có lỗi xảy ra mất rồi 😢');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  // Danh sách GV có thể chọn làm GV phụ (loại trừ GV chính đang chọn)
  const availableAdditionalTeachers = teachers.filter(t => t._id !== formData.teacher);

  if (showForm) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">{editing ? 'Edit Course' : 'Add New Course'}</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Course Name</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">👶</span>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.slice(0, 40)})} required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 outline-none text-sm ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} placeholder="English Explorers" />
              </div>
              {errors.name && <p className="text-red-500 text-[10px] mt-1 ml-1 font-semibold">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Age Group</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">🎂</span>
                <select value={formData.ageGroup} onChange={e => setFormData({...formData, ageGroup: e.target.value})} required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 outline-none text-sm ${errors.ageGroup ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`}>
                  <option value="">Select Age Group</option>
                  <option value="4-6">4 – 6 years old</option>
                  <option value="7-10">7 – 10 years old</option>
                  <option value="11-15">11 – 15 years old</option>
                </select>
              </div>
              {errors.ageGroup && <p className="text-red-500 text-[10px] mt-1 ml-1 font-semibold">{errors.ageGroup}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Duration</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">🕐</span>
                <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 outline-none text-sm ${errors.duration ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} placeholder="12 weeks – 2 lessons/week" />
              </div>
              {errors.duration && <p className="text-red-500 text-[10px] mt-1 ml-1 font-semibold">{errors.duration}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Class Size</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">👥</span>
                <input type="number" value={formData.classSize} onChange={e => setFormData({...formData, classSize: e.target.value})} required min="1" max="100"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 outline-none text-sm ${errors.classSize ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} placeholder="10" />
              </div>
              {errors.classSize && <p className="text-red-500 text-[10px] mt-1 ml-1 font-semibold">{errors.classSize}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Giáo viên chính ⭐</label>
              <select
                value={formData.teacher}
                onChange={e => {
                  const newMain = e.target.value;
                  // Nếu GV chính mới đang có trong danh sách GV phụ → tự động bỏ ra
                  setFormData(prev => ({
                    ...prev,
                    teacher: newMain,
                    additionalTeachers: prev.additionalTeachers.filter(id => id !== newMain)
                  }));
                }}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none text-sm">
                <option value="">Select Teacher</option>
                {teachers.map(tc => <option key={tc._id} value={tc._id}>👩‍🏫 {tc.name}</option>)}
              </select>
            </div>
          </div>

          {/* ── Giáo viên phụ ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Giáo viên phụ
              <span className="ml-2 text-xs font-normal text-gray-400">(tùy chọn, tối đa 4 người)</span>
            </label>
            {availableAdditionalTeachers.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">
                {teachers.length === 0 ? 'Chưa có giáo viên nào.' : 'Không còn giáo viên khả dụng (đã chọn làm GV chính).'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {availableAdditionalTeachers.map(tc => {
                  const selected = formData.additionalTeachers.includes(tc._id);
                  return (
                    <button
                      key={tc._id}
                      type="button"
                      onClick={() => toggleAdditionalTeacher(tc._id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all duration-150
                        ${selected
                          ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-500'
                        }`}
                    >
                      <span>{selected ? '✓' : '+'}</span>
                      <span>👩‍🏫 {tc.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {formData.additionalTeachers.length > 0 && (
              <p className="text-xs text-blue-500 mt-1.5 font-medium">
                Đã chọn {formData.additionalTeachers.length}/4 giáo viên phụ
              </p>
            )}
            {errors.additionalTeachers && (
              <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.additionalTeachers}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Course Description</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">📝</span>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none text-sm resize-none"
                placeholder="Course outline and goals..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Course Highlights (Max 40 chars per item)</label>
            <input type="text" value={formData.highlights} onChange={e => setFormData({...formData, highlights: e.target.value})}
              className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm ${errors.highlights ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`}
              placeholder="Good pronunciation, Learning by playing, Friendly teacher" />
            {errors.highlights && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.highlights}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Thumbnail</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary-400 transition-all">
                  <div className="text-3xl mb-1">📤</div>
                  <p className="text-xs text-gray-500">Add Image</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreview && (
                <img src={imagePreview} alt="" className="w-20 h-20 rounded-xl object-cover" onError={handleImageError} />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {errors.submit && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100">{errors.submit}</p>}
            <div className="flex gap-3">
              <PrimaryButton type="submit" isLoading={isSubmitting} variant="success" className="px-8">
                {editing ? 'Save Changes' : 'Save Course'}
              </PrimaryButton>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-8 py-2.5 rounded-xl font-semibold hover:bg-gray-300 text-sm transition-all hover:shadow-button hover:-translate-y-0.5">
                ✕ Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">📚 Course Management</h2>
        <button onClick={openAdd} className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-600 transition-all text-sm">
          + Add Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => (
          <div key={course._id} className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition-all">
            {course.image && (
              <img src={getImageUrl(course.image)} alt={course.name} className="w-full h-40 object-cover rounded-xl mb-3" onError={handleImageError} />
            )}
            <h3 className="font-bold text-lg text-gray-800 mb-1">{course.name}</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">🎂 {course.ageGroup}</span>
              <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">🕐 {course.duration}</span>
              <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">👥 {course.classSize}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
            {/* Giáo viên chính */}
            {course.teacher && (
              <p className="text-xs text-primary-500 font-semibold">⭐ {course.teacher.name}</p>
            )}
            {/* Giáo viên phụ */}
            {course.additionalTeachers?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 mb-2">
                {course.additionalTeachers.map(t => (
                  <span key={t._id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                    👩‍🏫 {t.name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => openEdit(course)} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-600 hover:shadow-button hover:-translate-y-0.5 transition-all">✏️ Edit</button>
              <button onClick={() => handleDeleteClick(course._id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 hover:shadow-button hover:-translate-y-0.5 transition-all">🗑️ Delete</button>
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="text-gray-400 col-span-3 text-center py-8">No courses yet. Add one!</p>}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Xoá khoá học này? 🤔"
        message="Khoá học này sẽ bị xoá vĩnh viễn và không thể khôi phục. Bạn chắn chắn chưa? 🌪️"
      />
    </div>
  );
};

export default CourseManagement;
