import { useState, useEffect } from 'react';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', specialization: '', experience: '', description: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      setTeachers([]);
    }
  };

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = teachers.filter(tc =>
    !search || tc.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { 
    setEditing(null); 
    setFormData({ name: '', specialization: '', experience: '', description: '' }); 
    setAvatarFile(null); 
    setAvatarPreview(''); 
    setErrors({});
    setShowForm(true); 
  };
  const openEdit = (tc) => { 
    setEditing(tc); 
    setFormData({ name: tc.name, specialization: tc.specialization, experience: tc.experience, description: tc.description }); 
    setAvatarFile(null); 
    setAvatarPreview(getImageUrl(tc.avatar)); 
    setErrors({});
    setShowForm(true); 
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    else if (formData.name.length > 40) newErrors.name = 'Max 40 characters';

    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    else if (formData.specialization.length > 100) newErrors.specialization = 'Max 100 characters';

    const exp = parseInt(formData.experience);
    if (!formData.experience && formData.experience !== 0) newErrors.experience = 'Experience is required';
    else if (isNaN(exp) || exp < 1 || exp > 40) newErrors.experience = 'Range 1 - 40 years';

    if (formData.description && formData.description.length > 50) newErrors.description = 'Max 50 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
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
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    if (avatarFile) fd.append('avatar', avatarFile);
    try {
      if (editing) { await api.put(`/teachers/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      else { await api.post('/teachers', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      setShowForm(false);
      fetchData();
    } catch (err) { 
      console.error(err);
      setErrors({ submit: err.response?.data?.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try { await api.delete(`/teachers/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Teacher Management</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none text-sm" />
        </div>
        <button onClick={openAdd} className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-600 transition-all text-sm whitespace-nowrap">
          Add Teacher
        </button>
      </div>

      {/* Table Layout */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Avatar</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Teacher Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Specialization</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Experience</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tc => (
                <tr key={tc._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
                      {tc.avatar ? (
                        <img 
                          src={getImageUrl(tc.avatar)} 
                          alt={tc.name} 
                          className="w-full h-full object-cover" 
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-xl">👩‍🏫</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{tc.name}</td>
                  <td className="px-4 py-3 text-gray-600">{tc.specialization}</td>
                  <td className="px-4 py-3">{tc.experience} years</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(tc)} className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600 flex items-center gap-1">
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteTeacher(tc._id)} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 flex items-center gap-1">
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-400">No teachers yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal with Preview */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeInUp" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-5">Teacher Management</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Teacher Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">👤</span>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.slice(0, 40)})} required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 outline-none text-sm ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} placeholder="Ms. Emily" />
                </div>
                {errors.name && <p className="text-red-500 text-[10px] mt-1 ml-1 font-semibold">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Specialization 🎓</label>
                  <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value.slice(0, 100)})} required
                    className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm ${errors.specialization ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} placeholder="Subject Expert" />
                  {errors.specialization && <p className="text-red-500 text-[10px] mt-1 ml-1 font-semibold">{errors.specialization}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Years of Experience 📊</label>
                  <input type="number" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} required min="1" max="40"
                    className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm ${errors.experience ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} placeholder="5" />
                  {errors.experience && <p className="text-red-500 text-[10px] mt-1 ml-1 font-semibold">{errors.experience}</p>}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Short Description 📝</label>
                  <span className={`text-[10px] ${formData.description?.length > 50 ? 'text-red-500' : 'text-gray-400'}`}>
                    {formData.description?.length || 0}/50
                  </span>
                </div>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.slice(0, 50)})} rows="3"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm resize-none ${errors.description ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`}
                  placeholder="Friendly teacher, well-versed in early education" />
                {errors.description && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Preview section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preview section</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gradient-to-br from-yellow-50 to-green-50">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-3xl">👩‍🏫</span>
                      )}
                    </div>
                    <p className="font-bold text-gray-800">{formData.name || 'Teacher Name'}</p>
                    <p className="text-xs text-primary-500 font-semibold">{formData.specialization || 'Specialization'}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-3">{formData.description || 'Description'}</p>
                  </div>
                </div>

                {/* Avatar upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
                    {avatarPreview && (
                      <img 
                        src={avatarPreview} 
                        alt="" 
                        className="w-20 h-20 rounded-full mx-auto mb-2 object-cover" 
                        onError={handleImageError}
                      />
                    )}
                    <label className="cursor-pointer inline-block">
                      <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200">
                        📤 Browse Files
                      </div>
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {errors.submit && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">{errors.submit}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-semibold hover:bg-green-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Saving...' : (editing ? 'Save Changes' : 'Add Teacher')}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 text-sm">
                    ✕ Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
