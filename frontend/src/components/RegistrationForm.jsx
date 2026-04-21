import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import RecaptchaBox from './RecaptchaBox';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const RegistrationForm = () => {
  const { t } = useTranslation();

  const fieldErrorMap = {
    parentName: "form.nameRequired",
    childAge: "form.ageInvalid",
    phone: "form.phoneInvalid",
    childName: "form.childNameRequired",
    email: "form.emailInvalid",
    message: "form.noteTooLong",
    courseId: "form.courseRequired"
  };

  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    parentName: '', phone: '', childName: '', childAge: 'preschool', courseId: '', email: '', message: ''
  });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState({ loading: false });
  const [duplicateConfirm, setDuplicateConfirm] = useState(null);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (field, value) => {
    if (field === 'message' && value.length > 200) return;
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e, ignoreDuplicate = false) => {
    if (e) e.preventDefault();

    if (!captchaToken && !ignoreDuplicate) {
      toast.warning(t("form.captcha_required"));
      return;
    }

    setStatus({ loading: true });
    setFieldErrors({});

    try {
      const courseName = selectedCourse ? selectedCourse.name : '';
      const res = await api.post('/registrations', {
        ...formData,
        captchaToken,
        courseName,
        ignoreDuplicate
      });

      if (res.data.warning && res.data.type === 'DUPLICATE_WARN') {
        setDuplicateConfirm({ message: res.data.message, data: formData });
        if (recaptchaRef.current) recaptchaRef.current.reset();
        setCaptchaToken(null);
        setStatus({ loading: false });
        return;
      }

      toast.success(t("form.submitSuccess"), {
        icon: "🚀",
        style: { borderRadius: '20px', fontWeight: 'bold' }
      });
      setFormData({ parentName: '', phone: '', childName: '', childAge: 'preschool', courseId: '', email: '', message: '' });
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setCaptchaToken(null);
      setDuplicateConfirm(null);
      setStatus({ loading: false });

    } catch (err) {
      const data = err?.response?.data || err;
      const msg = data?.message || err?.message || '';
      const status = err?.response?.status || err?.status;

      // ✅ 429 — Rate limit
      if (status === 429) {
        toast.error(
          t("form.rateLimit", "⏳ Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau 1 giờ."),
          { autoClose: 6000, icon: "⏳" }
        );

      // ✅ 403 — CSRF hoặc security policy
      } else if (status === 403) {
        toast.error(
          t("form.securityError", "🔒 Phiên làm việc đã hết hạn. Vui lòng tải lại trang và thử lại."),
          { autoClose: 8000, icon: "🔒" }
        );

      // ✅ Captcha hết hạn
      } else if (msg === 'captcha_invalid' || msg === 'captcha_required' || msg?.includes('captcha')) {
        toast.error(
          t("form.captchaExpired", "🤖 Captcha đã hết hạn, vui lòng xác nhận lại."),
          { autoClose: 5000 }
        );

      // ✅ Lớp đầy
      } else if (msg === 'CLASS_FULL' || msg?.includes('CLASS_FULL')) {
        toast.error(t("form.CLASS_FULL"), { autoClose: 5000 });

      // ✅ Validation errors từ backend
      } else {
        const backendErrors = data?.errors;
        if (backendErrors && Array.isArray(backendErrors)) {
          const errorMap = {};
          backendErrors.forEach(error => {
            errorMap[error.path || error.field] = fieldErrorMap[error.path || error.field] || "form.unknownError";
          });
          setFieldErrors(errorMap);
          toast.error(t("form.validationError") || t("form.unknownError"));

          setTimeout(() => {
            const firstErrorField = backendErrors[0].path || backendErrors[0].field;
            const element = document.getElementsByName(firstErrorField)[0];
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.focus();
            }
          }, 100);
        } else {
          // ✅ Lỗi chung — không hiện technical message cho user
          toast.error(
            t("form.genericError", "😕 Đã có lỗi xảy ra. Vui lòng thử lại sau ít phút."),
            { autoClose: 5000 }
          );
        }
      }

      if (recaptchaRef.current) recaptchaRef.current.reset();
      setCaptchaToken(null);
      setStatus({ loading: false });
    }
  };

  const selectedCourse = courses.find(c => c._id === formData.courseId);
  const isFull = selectedCourse && (selectedCourse.activeStudentCount || 0) >= selectedCourse.classSize;

  return (
    <section id="register" className="py-20 px-6 bg-[#C2E0F9] relative flex flex-col md:flex-row items-center justify-center gap-10 min-h-[80vh] overflow-hidden">
      {/* Decorative stars */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-10 left-10 text-3xl opacity-60 text-white">⭐</motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-20 right-20 text-4xl opacity-60 text-yellow-400">⭐</motion.div>

      {/* Hero Illustration */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="hidden lg:flex flex-col items-start justify-center max-w-lg mr-10 relative z-10"
      >
        <h2 className="text-5xl font-display font-black text-text-main mb-4 text-left leading-tight">
          {t('registration.leftTitle')}
        </h2>
        <p className="text-lg font-semibold text-text-main opacity-80 mb-4 text-left">
          {t('registration.leftDesc')}
        </p>
        <div className="mt-4 flex justify-center md:justify-start w-full">
          <img
            src="/kids.png"
            alt="Kids pointing"
            className="w-[420px] object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
          />
        </div>
      </motion.div>

      {/* Registration Form Card */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="bg-white rounded-[3rem] p-8 md:p-10 w-full max-w-xl shadow-[12px_12px_0_#FDE047] border-4 border-[#FDE047] relative z-10"
      >
        <h2 className="text-4xl font-display font-black text-text-main mb-8 text-center">{t('registration.title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Parent Name */}
            <div className="group">
              <label className="block font-bold text-text-main mb-2 ml-1 text-sm">{t('registration.parentName')}</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xl group-focus-within:scale-110 transition-transform">👤</span>
                <input
                  name="parentName"
                  type="text"
                  value={formData.parentName}
                  onChange={e => handleChange('parentName', e.target.value)}
                  className={`w-full bg-[#D0EAF9] rounded-full py-3.5 pl-12 pr-6 text-sm outline-none border-2 transition-all placeholder-gray-400 font-semibold shadow-inner ${fieldErrors.parentName ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-blue-400 focus:bg-white'
                    }`}
                  placeholder={t('registration.placeholderName')}
                />
                <AnimatePresence>
                  {fieldErrors.parentName && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 text-[11px] font-bold mt-1 ml-4"
                    >
                      ⚠️ {t(fieldErrors.parentName)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Phone */}
            <div className="group">
              <label className="block font-bold text-text-main mb-2 ml-1 text-sm">{t('registration.phone')}</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xl group-focus-within:scale-110 transition-transform">📞</span>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className={`w-full bg-[#D0EAF9] rounded-full py-3.5 pl-12 pr-6 text-sm outline-none border-2 transition-all placeholder-gray-400 font-semibold shadow-inner ${fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-blue-400 focus:bg-white'
                    }`}
                  placeholder={t('registration.placeholderPhone')}
                />
                <AnimatePresence>
                  {fieldErrors.phone && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 text-[11px] font-bold mt-1 ml-4"
                    >
                      ⚠️ {t(fieldErrors.phone)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Child Name */}
            <div className="group">
              <label className="block font-bold text-text-main mb-2 ml-1 text-sm">{t('registration.childName')}</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xl group-focus-within:scale-110 transition-transform">🧒</span>
                <input
                  name="childName"
                  type="text"
                  value={formData.childName}
                  onChange={e => handleChange('childName', e.target.value)}
                  className={`w-full bg-[#D0EAF9] rounded-full py-3.5 pl-12 pr-6 text-sm outline-none border-2 transition-all placeholder-gray-400 font-semibold shadow-inner ${fieldErrors.childName ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-blue-400 focus:bg-white'
                    }`}
                  placeholder={t('registration.placeholderChild')}
                />
                <AnimatePresence>
                  {fieldErrors.childName && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 text-[11px] font-bold mt-1 ml-4"
                    >
                      ⚠️ {t(fieldErrors.childName)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Child Age Group */}
            <div className="group">
              <label className="block font-bold text-text-main mb-2 ml-1 text-sm">{t('registration.childAge')}</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xl group-focus-within:scale-110 transition-transform">📅</span>
                <select
                  name="childAge"
                  value={formData.childAge}
                  onChange={e => handleChange('childAge', e.target.value)}
                  className={`w-full bg-[#D0EAF9] rounded-full py-3.5 pl-12 pr-10 text-sm outline-none border-2 transition-all font-semibold appearance-none shadow-inner ${fieldErrors.childAge ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-blue-400 focus:bg-white'
                    }`}
                >
                  <option value="preschool">{t('ageGroup.preschool')}</option>
                  <option value="primary">{t('ageGroup.primary')}</option>
                  <option value="secondary">{t('ageGroup.secondary')}</option>
                  <option value="highschool">{t('ageGroup.highschool')}</option>
                  <option value="adult">{t('ageGroup.adult')}</option>
                </select>
                <span className="absolute right-5 top-4 text-gray-400 text-xs pointer-events-none">▼</span>
                <AnimatePresence>
                  {fieldErrors.childAge && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 text-[11px] font-bold mt-1 ml-4"
                    >
                      ⚠️ {t(fieldErrors.childAge)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Course Selection */}
          <div className="group">
            <label className="block font-bold text-text-main mb-2 ml-1 text-sm">{t('registration.courseSelect')}</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-xl group-focus-within:scale-110 transition-transform">📖</span>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={e => handleChange('courseId', e.target.value)}
                className={`w-full bg-[#FDF0C6] rounded-full py-3.5 pl-12 pr-10 text-sm outline-none border-2 transition-all font-semibold appearance-none shadow-inner ${fieldErrors.courseId ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-yellow-400 focus:bg-white'
                  }`}
              >
                <option value="" disabled>{t('registration.selectCourse')}</option>
                {courses.map(c => {
                  const courseFull = (c.activeStudentCount || 0) >= c.classSize;
                  return (
                    <option key={c._id} value={c._id}>
                      {c.name} {courseFull ? `(${t('form.CLASS_FULL').toUpperCase()})` : ''}
                    </option>
                  );
                })}
              </select>
              <span className="absolute right-5 top-4 text-gray-400 text-xs pointer-events-none">▼</span>
            </div>
            {isFull && <p className="text-red-600 text-[11px] font-black mt-2 ml-4 animate-pulse">⚠️ {t('form.CLASS_FULL')}! {t('journey.step2')}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Parent Email */}
            <div className="group">
              <label className="block font-bold text-text-main mb-2 ml-1 text-sm">{t('registration.email')}</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xl group-focus-within:scale-110 transition-transform">✉️</span>
                <input
                  name="email"
                  type="email" value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full bg-[#FDF0C6] rounded-full py-3.5 pl-12 pr-6 text-sm outline-none border-2 border-transparent focus:border-yellow-400 focus:bg-white transition-all placeholder-gray-400 font-semibold shadow-inner"
                  placeholder={t('registration.optional')}
                />
              </div>
            </div>

            {/* Message/Note */}
            <div className="group">
              <label className="block font-bold text-text-main mb-2 ml-1 text-sm">
                {t('registration.message')}
                <span className={`ml-2 text-[10px] ${formData.message.length >= 180 ? 'text-red-500' : 'text-gray-400'}`}>
                  ({formData.message.length}/200)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xl group-focus-within:scale-110 transition-transform">💬</span>
                <textarea
                  name="message"
                  rows="1"
                  value={formData.message}
                  onChange={e => handleChange('message', e.target.value)}
                  className="w-full bg-[#FDF0C6] rounded-2xl py-3.5 pl-12 pr-6 text-sm outline-none border-2 border-transparent focus:border-yellow-400 focus:bg-white transition-all placeholder-gray-400 font-semibold shadow-inner resize-none min-h-[50px]"
                  placeholder={t('registration.optional')}
                />
              </div>
            </div>
          </div>

          {/* ReCAPTCHA */}
          <RecaptchaBox ref={recaptchaRef} onVerify={(token) => setCaptchaToken(token)} />

          {/* Submit Button */}
          <div className="flex justify-center flex-col items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={status.loading || !captchaToken || isFull}
              className={`bg-[#4CAF50] text-white px-12 py-4 rounded-full text-xl font-display font-black transition-all shadow-[0_8px_0_#2E7D32] active:shadow-none active:translate-y-2 border-2 border-[#2E7D32] flex items-center justify-center gap-3 ${(status.loading || !captchaToken || isFull) ? 'opacity-60 cursor-not-allowed grayscale pointer-events-none' : ''
                }`}
            >
              {status.loading ? (
                <>
                  <span className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
                  {t('admin.redirecting')}
                </>
              ) : (
                <>
                  <span>🚀</span>
                  {t('registration.submit').toUpperCase()}
                </>
              )}
            </motion.button>
            {!captchaToken && !status.loading && <p className="text-gray-400 text-[10px] font-bold italic animate-pulse">🔒 {t('form.captcha_required')}</p>}
          </div>
        </form>
      </motion.div>

      {/* Duplicate Confirmation Modal */}
      <AnimatePresence>
        {duplicateConfirm && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border-4 border-yellow-400"
            >
              <div className="text-4xl text-center mb-4">🤔</div>
              <h3 className="text-xl font-black text-center mb-2 text-text-main">
                {t('admin.confirm')}
              </h3>
              <p className="text-center text-sm text-gray-600 mb-8 font-semibold italic">
                "Có vẻ học sinh này đã tồn tại, bạn có muốn tiếp tục đăng ký?"
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDuplicateConfirm(null)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 font-bold hover:bg-gray-200 transition-all text-text-main"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!captchaToken) {
                      toast.warning('Vui lòng xác minh captcha trước khi tiếp tục');
                      setDuplicateConfirm(null);
                      return;
                    }
                    handleSubmit(null, true);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                >
                  {t('admin.confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default RegistrationForm;
