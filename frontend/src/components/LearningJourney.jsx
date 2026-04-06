import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const LearningJourney = () => {
  const { t } = useTranslation();

  const steps = [
    {
      num: '01',
      title: t('journey.step1'),
      desc: t('journey.step1Desc'),
      image: '/images/learningJourney/step1.png',
      color: '#4A90E2',
    },
    {
      num: '02',
      title: t('journey.step2'),
      desc: t('journey.step2Desc'),
      image: '/images/learningJourney/step2.png',
      color: '#4CAF50',
    },
    {
      num: '03',
      title: t('journey.step3'),
      desc: t('journey.step3Desc'),
      image: '/images/learningJourney/step3.png',
      color: '#FF9800',
    }
  ];

  const floatingIcons = [
    { src: '/images/icon3d/blockABC.png', style: 'top-10 left-[8%] w-16', delay: 0, mobile: true },
    { src: '/images/icon3d/book.png', style: 'top-32 right-[12%] w-20', delay: 1, mobile: false },
    { src: '/images/icon3d/cloud.png', style: 'bottom-20 left-[5%] w-24 opacity-40', delay: 2, mobile: true },
    { src: '/images/icon3d/sun.png', style: 'top-40 right-[4%] w-20', delay: 0.5, mobile: true },
    { src: '/images/icon3d/pencil.png', style: 'bottom-40 right-[10%] w-14', delay: 1.5, mobile: false },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" }
    }
  };

  return (
    <section className="py-20 px-4 md:px-6 bg-white relative overflow-hidden">
      {/* Dot Pattern Background */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#4a90e2 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Floating 3D Icons */}
      {floatingIcons.map((icon, index) => (
        <motion.img
          key={index}
          src={icon.src}
          alt=""
          className={`absolute pointer-events-none z-40 ${icon.mobile ? 'block' : 'hidden md:block'} ${icon.style}`}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: icon.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-black text-text-main mb-4"
          >
            {t('journey.title')}
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            className="h-1.5 w-24 bg-primary rounded-full mx-auto mb-6 origin-center"
          />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto"
          >
            {t('journey.subtitle')}
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.04, 
                y: -12,
                boxShadow: `0 20px 40px ${step.color}44`,
                borderColor: step.color
              }}
              style={{ borderColor: `${step.color}88` }} // Semi-transparent border initially
              className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 relative group flex flex-col items-center text-center border-[4px] border-dashed overflow-hidden"
            >
              {/* Step Number Badge - high z-index */}
              <div 
                className="absolute top-6 right-6 text-[10px] font-black px-3 py-1 rounded-full text-white shadow-sm z-30"
                style={{ backgroundColor: step.color }}
              >
                STEP {step.num}
              </div>

              {/* Step Image - base z-index */}
              <div className="relative z-10 mb-8 w-full h-[200px] flex items-center justify-center transform group-hover:rotate-3 transition-transform duration-500">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="max-w-[200px] max-h-[200px] w-auto h-auto object-contain pointer-events-none"
                />
              </div>

              {/* Text Content - higher z-index */}
              <div className="relative z-20 w-full">
                <h4 
                  className="text-xl font-black mb-4"
                  style={{ color: step.color }}
                >
                  {step.title}
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed px-2 font-medium">
                  {step.desc}
                </p>
              </div>
              
              {/* Bottom line decoration */}
              <div 
                className="absolute bottom-0 left-0 h-2 w-full transition-all duration-500 rounded-b-[24px] z-30"
                style={{ backgroundColor: step.color }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LearningJourney;

