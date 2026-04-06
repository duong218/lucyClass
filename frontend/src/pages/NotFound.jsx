import React from 'react';
import { useNavigate } from 'react-router-dom';
import bg404 from '../assets/404.png';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="not-found-container" 
      style={{ backgroundImage: `url(${bg404})` }}
    >
      <button 
        className="back-home-btn animate-float-slow"
        onClick={() => navigate('/')}
      >
        Quay lại trang chủ →
      </button>
    </div>
  );
};

export default NotFound;
