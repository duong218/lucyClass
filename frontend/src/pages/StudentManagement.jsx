import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const StudentManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/courses');
            if (res.data.success) {
                setCourses(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (current, max) => {
        const percent = (current / max) * 100;
        if (percent >= 100) return 'bg-gradient-to-r from-rose-500 to-pink-600 shadow-sm shadow-rose-200 text-white border-0';
        if (percent >= 80) return 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm shadow-amber-200 text-white border-0';
        return 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-sm shadow-emerald-200 text-white border-0';
    };

    const getStatusText = (current, max) => {
        const percent = (current / max) * 100;
        if (percent >= 100) return t('admin.courseStatus.full');
        if (percent >= 80) return t('admin.courseStatus.almostFull');
        return t('admin.courseStatus.available');
    };

    const filteredCourses = courses.filter(course => 
        course.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">{t('common.loading') || 'Loading...'}</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight italic">
                        {t('admin.studentMgmt')}
                    </h1>
                    <div className="h-1.5 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                </div>
                
                <div className="relative w-full md:w-80 group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        🔍
                    </span>
                    <input 
                        type="text" 
                        placeholder={t('admin.search')}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white outline-none transition-all shadow-sm font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {filteredCourses.length === 0 ? (
                <div className="bg-gradient-to-b from-white to-slate-50 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 shadow-inner">
                    <div className="text-6xl mb-6 grayscale opacity-40">📭</div>
                    <p className="text-slate-400 text-lg font-bold">Không tìm thấy khóa học nào</p>
                    <p className="text-slate-300 text-sm mt-1">Hãy thử tìm kiếm với từ khóa khác</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCourses.map(course => {
                        const percent = Math.min(100, Math.round((course.activeStudentCount / course.classSize) * 100));
                        const statusStyles = getStatusColor(course.activeStudentCount, course.classSize);
                        
                        return (
                            <div 
                                key={course._id} 
                                className="bg-gradient-to-br from-white to-blue-50/40 rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-200/50 hover:border-blue-200 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
                            >
                                {/* Decorative background accent */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-200/30 transition-colors"></div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusStyles}`}>
                                        {getStatusText(course.activeStudentCount, course.classSize)}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-lg">
                                        ID: #{course._id.slice(-4).toUpperCase()}
                                    </span>
                                </div>

                                <h3 className="text-xl font-extrabold text-slate-800 mb-4 truncate group-hover:text-blue-600 transition-colors tracking-tight leading-none uppercase">
                                    {course.name}
                                </h3>
                                
                                <div className="space-y-6 relative z-10">
                                    <div className="flex justify-between items-end mb-1">
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('admin.child')}</span>
                                            <span className="text-2xl font-black text-slate-700 leading-none">
                                                {course.activeStudentCount}
                                                <span className="text-slate-300 text-sm font-bold ml-1">/ {course.classSize}</span>
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-black ${percent >= 100 ? 'text-rose-500' : percent >= 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {percent}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full bg-slate-100/80 h-3.5 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-100">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) relative ${
                                                percent >= 100 
                                                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' 
                                                    : percent >= 80 
                                                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(251,191,36,0.3)]' 
                                                        : 'bg-gradient-to-r from-blue-400 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                                            }`}
                                            style={{ width: `${percent}%` }}
                                        >
                                            {/* Shine effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        {percent >= 80 && percent < 100 && (
                                            <p className="text-[10px] text-amber-600 font-black flex items-center gap-1.5 uppercase tracking-wide bg-amber-50 py-1.5 px-3 rounded-xl border border-amber-100/50">
                                                <span className="animate-pulse">⚠️</span> {t('admin.courseStatus.warning')}
                                            </p>
                                        )}
                                        {percent >= 100 && (
                                            <p className="text-[10px] text-rose-600 font-black flex items-center gap-1.5 uppercase tracking-wide bg-rose-50 py-1.5 px-3 rounded-xl border border-rose-100/50">
                                                <span>🚫</span> {t('admin.courseStatus.full')}
                                            </p>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => navigate(`/admin/students/course/${course._id}`)}
                                        className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-black text-sm uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-blue-200 hover:scale-[1.03] active:scale-95 group-hover:shadow-blue-500/30"
                                    >
                                        {t('admin.viewStudents')} 
                                        <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
