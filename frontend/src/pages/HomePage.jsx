import React from 'react';
import Navbar from '../layouts/Navbar';
import Footer from '../layouts/Footer';
import HeroSection from '../components/HeroSection';
import CoursesSection from '../components/CoursesSection';
import WhyChooseUs from '../components/WhyChooseUs';
import LearningJourney from '../components/LearningJourney';
import TeachersSection from '../components/TeachersSection';
import ActivitiesSection from '../components/ActivitiesSection';
import TestimonialsSection from '../components/TestimonialsSection';
import RegistrationForm from '../components/RegistrationForm';
import Fireworks from '../components/Fireworks';
import AnnouncementSection from '../components/AnnouncementSection';
import ScrollHintButton from '../components/ScrollHintButton';
import ChatBox from '../components/ChatBox/ChatBox'; // ← THÊM

const HomePage = () => {
  return (
    <div className="relative font-sans text-text-main bg-white">
      <Fireworks />
      <Navbar />
      <ScrollHintButton />

      <HeroSection />
      <WhyChooseUs />
      <CoursesSection />
      <LearningJourney />
      <ActivitiesSection />
      <TeachersSection />
      <TestimonialsSection />
      <AnnouncementSection />
      <RegistrationForm />

      <Footer />

      {/* Chatbox nổi — render sau Footer để z-index luôn ở trên cùng */}
      <ChatBox /> {/* ← THÊM */}
    </div>
  );
};

export default HomePage;