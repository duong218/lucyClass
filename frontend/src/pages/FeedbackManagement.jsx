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
      console.error('Failed to fetch feedback:', err);
      setFeedbacks([]);
    }
  };

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = feedbacks.filter(fb =>
    !search || fb.parentName.toLowerCase().includes(search.toLowerCase()) || fb.childName.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { 
    setEditing(null); 
    setFormData({ parentName: '', childName: '', childAge: '', rating: 5, text: '' }); 
    setPhotoFile(null); 
    setPhotoPreview(''); 
    setErrors({});
    setShowForm(true); 
  };
  const openEdit = (fb) => { 
    setEditing(fb); 
    setFormData({ parentName: fb.parentName, childName: fb.childName, childAge: fb.childAge || '', rating: fb.rating, text: fb.text }); 
    setPhotoFile(null); 
    setPhotoPreview(getImageUrl(fb.photo)); 
    setErrors({});
    setShowForm(true); 
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) { const reader = new FileReader(); reader.onloadend = () => setPhotoPreview(reader.result); reader.readAsDataURL(file); }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.parentName.trim()) newErrors.parentName = 'Parent name is required';
    else if (formData.parentName.length > 32) newErrors.parentName = 'Max 32 characters';

    if (!formData.childName.trim()) newErrors.childName = 'Child name is required';
    else if (formData.childName.length > 32) newErrors.childName = 'Max 32 characters';

    const age = parseInt(formData.childAge);
    if (!formData.childAge) newErrors.childAge = 'Age is required';
    else if (age < 4 || age > 16) newErrors.childAge = 'Age must be 4-16';

    if (!formData.text.trim()) newErrors.text = 'Feedback is required';
    else if (formData.text.length > 200) newErrors.text = 'Max 200 characters';

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
        if (err.response?.data?.message) {
            setErrors({ submit: err.response.data.message });
        }
    }
  };

  const confirmDelete = (id) => setDeleteConfirm(id);
  const deleteFeedback = async () => {
    try { await api.delete(`/feedback/${deleteConfirm}`); setDeleteConfirm(null); fetchData(); } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Parent Feedback Management</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by parent or child name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none text-sm" />
        </div>
        <button onClick={openAdd} className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-600 transition-all text-sm whitespace-nowrap">
          Add Feedback
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Avatar</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Parent Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Child Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Child Age</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Rating</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Feedback Content</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(fb => (
                <tr key={fb._id} className="border-b last:border-0 hover:bg-green-50/30">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {fb.photo ? (
                        <img 
                          src={getImageUrl(fb.photo)} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{fb.parentName}</td>
                  <td className="px-4 py-3">{fb.childName}</td>
                  <td className="px-4 py-3">{fb.childAge} years</td>
                  <td className="px-4 py-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < fb.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-gray-600 line-clamp-2">{fb.text}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(fb)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600">✏️ Edit</button>
                      <button onClick={() => confirmDelete(fb._id)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-600">🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="7" className="text-center py-8 text-gray-400">No feedback yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeInUp" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Name</label>
                <input type="text" value={formData.parentName} maxLength={32}
                  onChange={e => setFormData({...formData, parentName: e.target.value})} required
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-all ${errors.parentName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} />
                {errors.parentName && <p className="text-red-500 text-xs mt-1">{errors.parentName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Child Name</label>
                  <input type="text" value={formData.childName} maxLength={32}
                    onChange={e => setFormData({...formData, childName: e.target.value})} required
                    className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-all ${errors.childName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} />
                  {errors.childName && <p className="text-red-500 text-xs mt-1">{errors.childName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Child Age</label>
                  <input type="number" value={formData.childAge} min="4" max="16"
                    onChange={e => setFormData({...formData, childAge: e.target.value})} required
                    className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-all ${errors.childAge ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} />
                  {errors.childAge && <p className="text-red-500 text-xs mt-1">{errors.childAge}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rating (1-5 stars)</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})}
                      className={`text-2xl ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Feedback Text</label>
                <textarea value={formData.text} maxLength={200}
                  onChange={e => setFormData({...formData, text: e.target.value})} required rows="3"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none text-sm resize-none transition-all ${errors.text ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-400'}`} />
                <div className="flex justify-between mt-1">
                  {errors.text ? <p className="text-red-500 text-xs">{errors.text}</p> : <div />}
                  <p className="text-gray-400 text-[10px]">{formData.text.length}/200</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Photo (Optional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        onError={handleImageError}
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200">📤 Upload Photo</div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              </div>
              {errors.submit && <p className="text-red-500 text-xs text-center">{errors.submit}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-semibold hover:bg-green-600 text-sm">
                  {editing ? 'Save Changes' : 'Add Feedback'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fadeInUp text-center" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-lg mb-4">Are you sure you want to delete this?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300">Cancel</button>
              <button onClick={deleteFeedback} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600">🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
