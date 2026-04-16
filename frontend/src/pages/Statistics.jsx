import { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/stats');
        setStats(res.data.data || res.data);
      } catch (err) {
        console.error('Lỗi tải thống kê:', err);
        setError('Tải dữ liệu thất bại. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu thống kê...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center p-6">
      <span className="text-6xl mb-2">⚠️</span>
      <h3 className="text-xl font-bold text-gray-800">{error}</h3>
      <button onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
        🔄 Thử lại
      </button>
    </div>
  );

  if (!stats || stats.totalRegistrations === 0) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center p-6">
      <span className="text-6xl mb-2">📊</span>
      <h3 className="text-xl font-bold text-gray-800">Chưa có dữ liệu thống kê</h3>
      <p className="text-gray-500 text-sm">Dữ liệu sẽ hiển thị sau khi có đăng ký đầu tiên</p>
    </div>
  );

  const chartColors = [
    'rgba(74, 144, 226, 0.85)', 'rgba(245, 166, 35, 0.85)',
    'rgba(126, 211, 33, 0.85)', 'rgba(189, 16, 224, 0.85)',
    'rgba(208, 2, 27, 0.85)',   'rgba(74, 74, 74, 0.85)',
    'rgba(80, 227, 194, 0.85)', 'rgba(41, 121, 255, 0.85)'
  ];

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(241,245,249,1)' } },
      x: { ticks: { color: '#64748b', font: { weight: '600' } }, grid: { display: false } }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };

  const regByCourse = Array.isArray(stats?.regByCourse) ? stats.regByCourse : [];
  const coursePopularity = {
    labels: regByCourse.map(r => r.courseName || 'N/A'),
    datasets: [{
      label: 'Đăng ký',
      data: regByCourse.map(r => r.total || 0),
      backgroundColor: chartColors,
      borderRadius: 10,
      hoverBackgroundColor: chartColors.map(c => c.replace('0.85', '1')),
      borderWidth: 0,
    }]
  };

  const dailyTrend = Array.isArray(stats?.dailyTrend) ? stats.dailyTrend : [];
  const dailyRegs = {
    labels: dailyTrend.map(d => d._id?.slice(5) || ''),
    datasets: [{
      label: 'Đăng ký theo ngày',
      data: dailyTrend.map(d => d.count || 0),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 8,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#3b82f6',
      pointBorderWidth: 3,
    }]
  };

  const ageDistData = Array.isArray(stats?.ageDistribution) ? stats.ageDistribution : [];
  const ageDist = {
    labels: ageDistData.map(a => `${a._id} tuổi`),
    datasets: [{
      data: ageDistData.map(a => a.count || 0),
      backgroundColor: chartColors,
      hoverOffset: 20,
      borderWidth: 4,
      borderColor: '#fff',
    }]
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">📊 Bảng thống kê</h2>
          <p className="text-gray-500 font-medium mt-0.5">Thông tin tổng quan theo thời gian thực</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-blue-100">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
          <span className="text-blue-700 font-bold text-sm">Đang cập nhật trực tiếp</span>
        </div>
      </div>

      {/* Thẻ tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tổng đăng ký', value: stats?.totalRegistrations, icon: '👥', color: 'blue' },
          {
            label: 'Hôm nay', value: `${stats?.todayCount || 0}`, icon: '🚀',
            sub: stats?.growth >= 0 ? `+${stats.growth}% so với hôm qua` : `${stats.growth}% so với hôm qua`,
            color: 'emerald'
          },
          { label: 'Khoá học đang mở', value: stats?.activeCourses, icon: '📚', color: 'amber' },
          { label: 'Tổng nhận xét', value: stats?.totalFeedback, icon: '💬', color: 'purple' }
        ].map((card, i) => (
          <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 bg-${card.color}-50`}>
              {card.icon}
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-3xl font-black text-gray-900">{card.value ?? '—'}</p>
            {card.sub && (
              <p className={`text-[10px] font-bold mt-2 ${card.sub.includes('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {card.sub}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Biểu đồ cột - Đăng ký theo khoá */}
        <motion.div variants={itemVariants} className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
              Đăng ký theo khoá học
            </h3>
            <div className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-wider">Xếp hạng</div>
          </div>
          <div className="h-[360px]">
            <Bar data={coursePopularity} options={barOptions} />
          </div>
        </motion.div>

        {/* Biểu đồ tròn - Phân bổ độ tuổi */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-xl font-black text-gray-800 w-full mb-8 flex items-center gap-2">
            <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
            Phân bổ độ tuổi
          </h3>
          <div className="w-full h-64 mb-6">
            <Pie data={ageDist} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, font: { weight: 'bold', size: 12 } } },
                tooltip: {
                  padding: 15,
                  titleFont: { size: 14 },
                  callbacks: {
                    label: (ctx) => {
                      const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                      const perc = Math.round((ctx.parsed / sum) * 100);
                      return ` ${ctx.label}: ${ctx.parsed} học viên (${perc}%)`;
                    }
                  }
                }
              }
            }} />
          </div>
          <p className="text-xs text-gray-400 font-medium italic text-center">Di chuột vào từng phần để xem chi tiết</p>
        </motion.div>

        {/* Biểu đồ đường - Xu hướng đăng ký */}
        <motion.div variants={itemVariants} className="xl:col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
              Xu hướng đăng ký hàng ngày
            </h3>
            <div className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">30 ngày qua</div>
          </div>
          <div className="h-[280px]">
            <Line data={dailyRegs} options={{ ...barOptions, plugins: { ...barOptions.plugins, legend: { display: false } } }} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Statistics;
