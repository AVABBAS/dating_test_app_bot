import React, { useState } from 'react';

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', 'Online Now', 'New', 'Popular', 'Near You', 'Verified'];
  
  const exploreData = [
    { id: 1, name: 'Mia', age: 23, photoUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?q=80&w=400&auto=format&fit=crop' },
    { id: 2, name: 'Liam', age: 27, photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop' },
    { id: 3, name: 'Olivia', age: 25, photoUrl: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=400&auto=format&fit=crop' },
    { id: 4, name: 'Noah', age: 28, photoUrl: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=400&auto=format&fit=crop' },
    { id: 5, name: 'Ava', age: 24, photoUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop' },
    { id: 6, name: 'Ethan', age: 26, photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop' },
  ];

  return (
    <div className="explore-page">
      <div className="explore-header">
        <h1 className="explore-title">Explore</h1>
        
        <div className="categories-scroll">
          {categories.map(cat => (
            <div 
              key={cat} 
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div className="explore-grid">
        {exploreData.map(profile => (
          <div key={profile.id} className="explore-card">
            <img src={profile.photoUrl} alt={profile.name} className="explore-img" />
            <div className="explore-info">
              <span className="explore-name">{profile.name}, {profile.age}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;
