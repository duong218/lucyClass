import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityPopup from './ActivityPopup';

/**
 * ActivitiesSection Component
 * Renders a grid of school activities with image illustrations.
 * Features:
 * - Responsive grid (2 cols mobile, 3 cols tablet, 4 cols desktop)
 * - Interactive cards with hover effects
 * - Image fallback for broken links
 * - CTA button to view schedule
 */
const ActivitiesSection = () => {
  const { t } = useTranslation();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Activity data based on the redesign plan
  const activities = [
    { key: 'storytelling', nameKey: 'activities.storytelling', image: '/images/activities/activity_storytelling.png' },
    { key: 'buildingBlocks', nameKey: 'activities.buildingBlocks', image: '/images/activities/activity_buildingBlocks.png' },
    { key: 'singingKids', nameKey: 'activities.singingKids', image: '/images/activities/activity_singingKids.png' },
    { key: 'creativeDrawing', nameKey: 'activities.creativeDrawing', image: '/images/activities/activity_creativeDrawing.png' },
    { key: 'groupPlay', nameKey: 'activities.groupPlay', image: '/images/activities/activity_groupPlay.png' },
    { key: 'outdoorActivities', nameKey: 'activities.outdoorActivities', image: '/images/activities/activity_outdoorActivities.png' },
    { key: 'musicTime', nameKey: 'activities.musicTime', image: '/images/activities/activity_musicTime.png' },
    { key: 'crafting', nameKey: 'activities.crafting', image: '/images/activities/activity_crafting.png' },
  ];

  const visibleActivities = showAll ? activities : activities.slice(0, 4);

  // Handler for CTA button
  const handleViewSchedule = () => {
    setIsPopupOpen(true);
  };

  // Fallback image for activities
  const handleImageError = (e) => {
    e.target.src = '/images/fallback-activity.png';
  };

  return (
    <section id="activities" className="py-20 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 animate-fadeInUp">
          <h2 className="text-3xl md:text-4xl font-display font-black text-[#333333] mb-4">
            {t('activities.title')}
          </h2>
          <p className="text-base md:text-lg text-[#666666] max-w-2xl mx-auto font-medium">
            Khám phá những giờ học vui nhộn và bổ ích tại Lucy Class
          </p>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 transition-all duration-300">
          {visibleActivities.map((act) => (
            <div
              key={act.key}
              className="group flex flex-col items-center cursor-pointer"
            >
              <div className="w-full aspect-square overflow-hidden rounded-2xl shadow-md transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl relative bg-gray-50">
                <img
                  src={act.image}
                  alt={t(act.nameKey)}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  loading="lazy"
                />
              </div>
              <p className="mt-4 font-bold text-[#333333] text-lg transition-colors duration-300 group-hover:text-[#F5C542]">
                {t(act.nameKey)}
              </p>
            </div>
          ))}
        </div>

        {activities.length > 4 && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="text-blue-500 font-semibold text-sm hover:underline"
            >
              {showAll ? t('activities.showLess') : t('activities.showMore')}
            </button>
          </div>
        )}

        {/* CTA Button */}
        <div className="mt-12 md:mt-16 text-center animate-fadeInUp stagger-3">
          <button
            onClick={handleViewSchedule}
            className="inline-flex items-center gap-2 bg-[#F5C542] hover:bg-[#E0B030] text-white px-8 py-3 md:px-10 md:py-4 rounded-full text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95"
          >
            <span>📅</span> {t('activities.viewSchedule')}
          </button>
        </div>
      </div>

      {/* Activity Popup */}
      <ActivityPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </section>
  );
};

export default ActivitiesSection;
