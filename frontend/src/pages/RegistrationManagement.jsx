import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../services/api';
import { formatDateTime, getRelativeTime } from '../utils/dateUtils';

const RegistrationManagement = () => {
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const itemsPerPage = 10;

  const fetchStudents = async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const res = await api.get('/registrations', { params });
      
      if (res.data && res.data.success && res.data.data) {
        let data = res.data.data.registrations || [];
        if (courseFilter) data = data.filter(r => (r.courseId?._id || r.courseId) === courseFilter);
        setRegistrations(Array.isArray(data) ? data : []);
        setTotalRegistrations(res.data.data.total || 0);
        setTotalPages(res.data.data.pages || 1);
      } else {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setRegistrations(data);
        setTotalRegistrations(data.length);
        setTotalPages(1);
      }
    } catch (err) { 
      console.error('Fetch registrations error:', err);
      setRegistrations([]);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      const data = res.data?.data || res.data || [];
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCourses([]);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        const statsData = res.data?.data || res.data || {};
        // Use global stats from backend if available
        if (statsData.todayCount !== undefined) {
            setTodayCount(statsData.todayCount);
            setWeekCount(statsData.weekCount || 0);
        } else {
            // Fallback: calculate from current registrations if backend doesn't provide
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            setTodayCount(registrations.filter(r => new Date(r.createdAt) >= today).length);
            setWeekCount(registrations.filter(r => new Date(r.createdAt) >= weekAgo).length);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
    fetchStudents();
  }, [search, statusFilter, courseFilter, currentPage]);

  const paginated = Array.isArray(registrations) ? registrations : [];

  const updateStudentStatus = async (id, status) => {
    setIsUpdating(true);
    // OPTIONAL: Update local state immediately for better UX
    const originalRegistrations = [...registrations];
    setRegistrations(prev => 
      prev.map(r => r._id === id ? { ...r, status } : r)
    );

    try { 
      await api.put(`/registrations/${id}`, { status }); 
      toast.success('Cập nhật trạng thái thành công');
      // Refetch data after update
      await Promise.all([
        fetchStudents(),
        fetchCourses()
      ]);
    } catch (err) { 
      // Rollback on error
      setRegistrations(originalRegistrations);
      const msg = err.response?.data?.message || err.message || '';
      if (msg === 'Lớp đã đủ học viên') {
        toast.error('Không thể thêm học sinh, lớp đã đủ');
      } else {
        toast.error(msg || 'Cập nhật thất bại');
      }
      console.error(err); 
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteReg = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try { 
      await api.delete(`/registrations/${id}`); 
      fetchStudents(); 
    } catch (err) { 
      console.error(err); 
    }
  };

  const statusColors = {
    not_contacted: 'bg-red-100 text-red-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    registered: 'bg-green-100 text-green-700',
  };
  const statusLabels = {
    not_contacted: 'Not Contacted',
    contacted: 'Contacted',
    registered: 'Registered',
  };

  // Helper: Get course object for the selected registration
  const getSelectedCourseInfo = () => {
    if (!selected?.courseId?._id) return null;
    return courses.find(c => c._id === selected.courseId._id);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Registration Management</h2>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none text-sm" />
        </div>
        <select value={courseFilter} onChange={e => { setCourseFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none text-sm min-w-[160px]">
          <option value="">All Courses</option>
          {Array.isArray(courses) && courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none text-sm min-w-[180px]">
          <option value="">All Status</option>
          <option value="not_contacted">{statusLabels.not_contacted}</option>
          <option value="contacted">{statusLabels.contacted}</option>
          <option value="registered">{statusLabels.registered}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">📅</span>
          <div>
            <p className="text-sm text-gray-600">Total Today</p>
            <p className="text-3xl font-bold text-blue-700">{todayCount || 0}</p>
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <div>
            <p className="text-sm text-gray-600">Total This Week</p>
            <p className="text-3xl font-bold text-green-700">{weekCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Parent</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Child</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Age</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Course</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(reg => (
                <tr key={reg._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                    {reg.parentName}
                  </td>
                  <td className="px-4 py-3">{reg.childName}</td>
                  <td className="px-4 py-3">{reg.childAge}</td>
                  <td className="px-4 py-3">{reg.courseId?.name || 'N/A'}</td>
                  <td className="px-4 py-3">{reg.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{formatDateTime(reg.createdAt)}</span>
                      <span className="text-xs text-gray-500">{getRelativeTime(reg.createdAt, t)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[reg.status] || 'bg-gray-100'}`}>
                      {statusLabels[reg.status] || reg.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(reg)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-100 border border-blue-100">View Details</button>
                      <button onClick={() => deleteReg(reg._id)} className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-100">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan="8" className="text-center py-12 text-gray-400 font-medium">No registrations found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-6 border-t bg-gray-50/50">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white text-sm hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm font-bold">‹</button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-semibold transition-all shadow-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'border bg-white hover:bg-gray-50'}`}>
                    {page}
                  </button>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="text-gray-400 px-1">...</span>;
              return null;
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white text-sm hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm font-bold">›</button>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-xl">✕</button>
            <h3 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-2">
                <span className="p-2 bg-blue-50 rounded-lg text-blue-600">📄</span>
                Registration Details
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"><span className="font-semibold text-gray-500">Parent Name</span><span className="font-bold text-gray-800">{selected.parentName}</span></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"><span className="font-semibold text-gray-500">Child Name</span><span className="font-bold text-gray-800">{selected.childName}</span></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"><span className="font-semibold text-gray-500">Age</span><span className="font-bold text-gray-800">{selected.childAge} years old</span></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"><span className="font-semibold text-gray-500">Phone Number</span><span className="font-bold text-blue-600 underline cursor-pointer">{selected.phone}</span></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"><span className="font-semibold text-gray-500">Course</span><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-xs">{selected.courseId?.name || 'N/A'}</span></div>
              <div className="flex flex-col p-4 bg-gray-50 rounded-2xl gap-2">
                <span className="font-semibold text-gray-500">Message</span>
                <p className="text-gray-700 italic border-l-4 border-blue-200 pl-3">"{selected.message || 'No message left'}"</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {(() => {
                const courseInfo = getSelectedCourseInfo();
                const currentStudents = courseInfo?.activeStudentCount || 0;
                const maxStudents = courseInfo?.classSize || 0;
                const full = currentStudents >= maxStudents;
                const almostFull = !full && (currentStudents / maxStudents) >= 0.8;
                
                return (
                  <>
                    {selected.status === 'not_contacted' && (
                      <button 
                        disabled={isUpdating}
                        onClick={async () => { await updateStudentStatus(selected._id, 'contacted'); setSelected(null); }}
                        className={`bg-green-600 text-white py-3.5 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 text-sm ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isUpdating ? 'Updating...' : 'Mark as Contacted'}
                      </button>
                    )}
                    {selected.status === 'contacted' && (
                      <span className="bg-yellow-100 text-yellow-700 py-3.5 rounded-2xl font-bold text-center border-2 border-yellow-200 text-sm">
                        Đã liên hệ
                      </span>
                    )}
                    {selected.status === 'contacted' && (
                      <div className="flex flex-col gap-2">
                        {almostFull && !full && (
                          <p className="text-yellow-600 text-[11px] font-bold animate-pulse text-center">⚠️ Lớp sắp đầy, hãy xác nhận sớm ({currentStudents}/{maxStudents})</p>
                        )}
                        {full && (
                          <p className="text-red-600 text-[11px] font-bold text-center">🚫 Lớp đã đủ học viên ({currentStudents}/{maxStudents})</p>
                        )}
                        <button 
                          disabled={full || isUpdating}
                          onClick={async () => { await updateStudentStatus(selected._id, 'registered'); setSelected(null); }}
                          className={`text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg text-sm ${
                            full 
                              ? 'bg-gray-400 cursor-not-allowed shadow-gray-100' 
                              : isUpdating
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                          }`}>
                          {isUpdating ? 'Updating...' : full ? 'Đã đầy' : 'Confirm Registration'}
                        </button>
                      </div>
                    )}
                    <button 
                      disabled={isUpdating}
                      onClick={() => setSelected(null)}
                      className="bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition-all text-sm">
                      Close
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationManagement;
