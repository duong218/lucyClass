import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, GraduationCap, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import images (Assuming they exist/will be provided)
import mainIllustration from '../assets/why-us-main.png';
import step1Img from '../assets/why-us-step1.png';
import step2Img from '../assets/why-us-step2.png';
import step3Img from '../assets/why-us-step3.png';

const WhyChooseUs = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  const steps = [
    {
      id: '01',
      title: t('whyUs.teachers'),
      desc: t('whyUs.teachersDesc'),
      icon: <Users className="w-8 h-8 text-[#4A90E2]" />,
      image: step1Img,
      bgColor: 'bg-pastel-blue',
      accentColor: 'text-[#4A90E2]',
    },
    {
      id: '02',
      title: t('whyUs.funClasses'),
      desc: t('whyUs.funClassesDesc'),
      icon: <GraduationCap className="w-8 h-8 text-[#56B256]" />,
      image: step2Img,
      bgColor: 'bg-pastel-green',
      accentColor: 'text-[#56B256]',
    },
    {
      id: '03',
      title: t('whyUs.confidence'),
      desc: t('whyUs.confidenceDesc'),
      icon: <Sparkles className="w-8 h-8 text-[#E67E22]" />,
      image: step3Img,
      bgColor: 'bg-pastel-orange',
      accentColor: 'text-[#E67E22]',
    },
  ];

  return (
    <section className="py-24 px-6 bg-[#F8FAFC] overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-pastel-blue/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-80 h-80 bg-pastel-yellow/30 rounded-full blur-3xl" />

      <motion.div
        className="max-w-7xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="text-center mb-16">
          <motion.span
            className="inline-block px-4 py-1.5 bg-primary-100 text-primary-600 rounded-full text-sm font-bold tracking-wider uppercase mb-4"
            variants={itemVariants}
          >
            {t('whyUs.title')}
          </motion.span>
          <motion.h2
            className="text-4xl md:text-5xl font-display font-black text-text-main mb-6 leading-tight"
            variants={itemVariants}
          >
            {t('whyUs.subtitle')}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Illustration Area */}
          <motion.div
            className="relative"
            variants={itemVariants}
          >
            {/* Main Illustration with Float Animation */}
            <motion.div
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative z-10"
            >
              <img
                src={mainIllustration}
                alt="Educational Illustration"
                className="w-full max-w-xl mx-auto drop-shadow-2xl rounded-3xl"
              />
            </motion.div>

            {/* Decorative Floating Dots/Icons */}
            <motion.div
              className="absolute -top-10 -right-5 w-20 h-20 bg-pastel-orange/40 rounded-3xl -rotate-12 blur-lg"
              animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-10 -left-5 w-24 h-24 bg-pastel-green/40 rounded-full blur-lg"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
          </motion.div>

          {/* Right: Step Journey */}
          <div className="space-y-8 relative">
            {/* Vertical Line Connection */}
            <div className="absolute left-6 top-8 bottom-8 w-1 border-l-2 border-dashed border-primary-200 hidden md:block" />

            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, x: 10 }}
                className="relative flex gap-6"
              >
                {/* Step Marker */}
                <div className="relative z-10 hidden md:flex flex-shrink-0 w-12 h-12 rounded-full bg-white border-4 border-primary-100 shadow-md items-center justify-center font-display font-black text-primary-500">
                  {step.id}
                </div>

                {/* Card */}
                <div className="flex-grow bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50 hover:shadow-card-hover transition-all group">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className={`w-20 h-20 md:w-24 md:h-24 ${step.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:rotate-3`}>
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-16 h-16 md:w-20 md:h-20 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden items-center justify-center">
                        {step.icon}
                      </div>
                    </div>

                    <div className="text-center md:text-left">
                      <h4 className="text-xl font-bold text-text-main mb-2 font-display">
                        {step.title}
                      </h4>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* CTA Button */}
            <motion.div
              className="pt-6 md:pl-20"
              variants={itemVariants}
            >
              <button
                onClick={() => {
                  const el = document.getElementById("courses");
                  if (el) {
                    window.scrollTo({
                      top: el.offsetTop - 80, // tránh bị header che
                      behavior: "smooth"
                    });
                  }
                }}
                className="inline-flex items-center gap-3 bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-full font-bold shadow-button hover:translate-y-1 transition-all"
              >
                <span>{t("whyUs.exploreMore")}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default WhyChooseUs;

