import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../telegram';

const Onboarding = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    photoUrl: '',
    name: user?.first_name || '',
    age: '',
    gender: 'other',
    bio: '',
    interests: [],
    lookingFor: 'everyone'
  });

  const totalSteps = 4;
  const interestsList = [
    '🎵 Music', '🎬 Movies', '✈️ Travel', '📚 Reading', '🏋️ Fitness', 
    '🎨 Art', '🍳 Cooking', '📸 Photography', '🎮 Gaming', '🧘 Yoga', 
    '⚽ Sports', '🐱 Pets', '☕ Coffee', '🏔️ Hiking', '💻 Tech', '🎭 Theater'
  ];

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else submitData();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleInterest = (interest) => {
    if (formData.interests.includes(interest)) {
      setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) });
    } else {
      if (formData.interests.length < 5) {
        setFormData({ ...formData, interests: [...formData.interests, interest] });
      }
    }
  };

  const submitData = async () => {
    try {
      await axios.put(`${API_URL}/user/${user?.telegramId || '123'}`, {
        ...formData,
        onboardingComplete: true
      });
      onComplete();
    } catch (err) {
      console.error('Onboarding failed:', err);
      onComplete(); // fallback for dev
    }
  };

  return (
    <div className="onboarding-page">
      <div className="progress-bar-container">
        {[...Array(totalSteps)].map((_, i) => (
          <div key={i} className="progress-segment">
            <div className={`progress-fill ${step > i ? 'filled' : ''}`}></div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="step-container">
          <h2 className="step-title">Add your photo</h2>
          <p className="step-subtitle">Show your best self to the world.</p>
          
          <div className="photo-preview">
            {formData.photoUrl ? (
              <img src={formData.photoUrl} alt="Preview" />
            ) : (
              <span style={{color: 'var(--text-secondary)'}}>No photo</span>
            )}
          </div>
          
          <div className="input-group">
            <label>Photo URL</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="https://..."
              value={formData.photoUrl}
              onChange={e => setFormData({...formData, photoUrl: e.target.value})}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-container">
          <h2 className="step-title">Basic info</h2>
          <p className="step-subtitle">Tell us a bit about yourself.</p>
          
          <div className="input-group">
            <label>Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="input-group">
            <label>Age</label>
            <input 
              type="number" 
              className="form-input" 
              value={formData.age}
              onChange={e => setFormData({...formData, age: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label>Gender</label>
            <select 
              className="form-input"
              value={formData.gender}
              onChange={e => setFormData({...formData, gender: e.target.value})}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step-container">
          <h2 className="step-title">Your Bio & Interests</h2>
          <p className="step-subtitle">What makes you unique?</p>
          
          <div className="input-group">
            <label>Bio</label>
            <textarea 
              className="form-input" 
              placeholder="Write a little about yourself..."
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
            />
          </div>
          
          <div className="input-group">
            <label>Interests (Up to 5)</label>
            <div className="tags-container">
              {interestsList.map(tag => (
                <div 
                  key={tag}
                  className={`tag ${formData.interests.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(tag)}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="step-container">
          <h2 className="step-title">Preferences</h2>
          <p className="step-subtitle">Who are you looking to meet?</p>
          
          <div className="input-group">
            <label>Looking for</label>
            <select 
              className="form-input"
              value={formData.lookingFor}
              onChange={e => setFormData({...formData, lookingFor: e.target.value})}
            >
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="everyone">Everyone</option>
            </select>
          </div>
        </div>
      )}

      <div className="onboarding-buttons">
        {step > 1 && (
          <button className="match-btn btn-secondary" style={{width: '30%'}} onClick={handleBack}>
            Back
          </button>
        )}
        <button 
          className="match-btn btn-primary" 
          style={{flex: 1, margin: 0}}
          onClick={handleNext}
        >
          {step === totalSteps ? 'Start Swiping ✨' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
