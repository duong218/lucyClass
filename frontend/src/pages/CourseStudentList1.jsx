import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showToast } from '../utils/toastUtils';
import ConfirmModal from '../components/common/ConfirmModal';
import api from '../services/api';

const CourseStudentList = () => {
    const { t } = useTranslation();
    const { courseId } = useParams();
    const navigate = useNavigate();
    
    const [students, setStudents] = useState([]);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, inactive
    const [showConfirm, setShowConfirm] = useState(null); // student object or null

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, courseRes] = await Promise.all([
                api.get(`/courses/${courseId}/students`),
                api.get(`/courses/${courseId}`)
            ]);
            
            if (studentsRes.data.success) {
                setStudents(studentsRes.data.data);
            }
            if (courseRes.data.success) {
                setCourse(courseRes.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showToast.error('Lỗi khi tải dữ liệu 😢');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (studentId) => {
        setShowConfirm(null);
        
        // Optimistic UI Update
        const originalStudents = [...students];
        setStudents(prev => prev.map(s => s._id === studentId ? { ...s, isActive: false } : s));

        try {
            const res = await api.put(`/students/${studentId}/remove`);
            if (res.data.success) {
                showToast.success('Tadaa! Đã cập nhật xong! 🎉');
            } else {
                throw new Error(res.data.message);
            }
        } catch (error) {
            console.error('Remove failed:', error);
            setStudents(originalStudents); // Rollback
            showToast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái 😢');
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = 
                student.childName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                student.parentName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                student.phone.includes(debouncedSearch);
            
            const matchesFilter = 
                filter === 'all' || 
                (filter === 'active' && student.isActive) || 
                (filter === 'inactive' && !student.isActive);
            
            return matchesSearch && matchesFilter;
        });
    }, [students, debouncedSearch, filter]);

    if (loading) return <div className="flex items-center justify-center h-64"><span className="text-4xl animate-bounce">⏳</span></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/admin/students')}
                    className="p-3 bg-white border rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                >
                    ←
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{course?.name || 'Khóa học'}</h1>
                    <p className="text-sm text-gray-400 capitalize">{t('admin.studentMgmt')} / {course?.ageGroup}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input 
                            type="text" 
                            placeholder={t('admin.search')}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'active', 'inactive'].map(f => {
                            const filterLabels = {
                                all: "Tất cả",
                                active: "Hoạt động",
                                inactive: "Đã nghỉ"
                            };
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        filter === f 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    {filterLabels[f]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b text-gray-400 text-xs uppercase tracking-wider font-extrabold">
                                <th className="pb-4 px-4">STT</th>
                                <th className="pb-4 px-4">{t('admin.child')}</th>
                                <th className="pb-4 px-4">{t('admin.age')}</th>
                                <th className="pb-4 px-4">{t('admin.parent')}</th>
                                <th className="pb-4 px-4">{t('admin.phone')}</th>
                                <th className="pb-4 px-4">{t('admin.status')}</th>
                                <th className="pb-4 px-4 text-center">{t('admin.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400">
                                        {t('admin.emptyStudents')}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s, i) => (
                                    <tr key={s._id} className={`hover:bg-gray-50/50 transition-colors ${!s.isActive ? 'bg-gray-50 italic opacity-80' : ''}`}>
                                        <td className="py-5 px-4 text-sm font-bold text-gray-400">{(i + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-5 px-4 font-bold text-gray-800">{s.childName}</td>
                                        <td className="py-5 px-4 text-sm text-gray-600 font-medium">{s.childAge}</td>
                                        <td className="py-5 px-4 text-sm text-gray-600 font-medium">{s.parentName}</td>
                                        <td className="py-5 px-4 text-sm text-gray-600 font-medium font-mono">{s.phone}</td>
                                        <td className="py-5 px-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                                s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {s.isActive ? t('admin.active') : t('admin.inactive')}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4">
                                            <div className="flex justify-center">
                                                <button
                                                    disabled={!s.isActive}
                                                    onClick={() => setShowConfirm(s)}
                                                    className={`p-2 rounded-xl transition-all ${
                                                        s.isActive 
                                                            ? 'text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95' 
                                                            : 'text-gray-300 cursor-not-allowed opacity-50'
                                                    }`}
                                                    title={t('admin.delete')}
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal 
                isOpen={!!showConfirm}
                onClose={() => setShowConfirm(null)}
                onConfirm={() => handleRemove(showConfirm._id)}
                title={t('admin.confirm') || "Chắc chắn xoá chứ?"}
                message={t('admin.removeConfirm') || "Hành động này sẽ thay đổi trạng thái của học viên!"}
            />
        </div>
    );
};

export default CourseStudentList;
