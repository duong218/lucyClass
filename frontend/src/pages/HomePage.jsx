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

const HomePage = () => {
  return (
    <div className="relative font-sans text-text-main bg-white">
      <Fireworks />
      <Navbar />

      {/* Sections order matches home page.png layout logic */}
      <HeroSection />
      <WhyChooseUs />
      <CoursesSection />
      <LearningJourney />
      <ActivitiesSection />
      <TeachersSection />
      <TestimonialsSection />
      <AnnouncementSection />
      {/* Wavy bottom border specifically for Registration form transition if needed, actually it has its own blue bg */}
      <RegistrationForm />

      <Footer />
    </div>
  );
};

export default HomePage;
