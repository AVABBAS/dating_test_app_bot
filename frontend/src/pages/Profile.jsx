import React from 'react';

const Profile = ({ user }) => {
  // Use user data or dummy data
  const profileData = {
    name: user?.first_name || 'Alex',
    age: 25,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    bio: 'Passionate about design and coffee. Always looking for the next adventure.',
    interests: ['🎨 Art', '☕ Coffee', '✈️ Travel', '📸 Photography'],
    likesReceived: 42
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src={profileData.photoUrl} alt="Cover" className="profile-cover" />
        <div className="profile-cover-gradient"></div>
      </div>

      <div className="profile-details">
        <div className="profile-name-age">
          <h1>{profileData.name}</h1>
          <span>{profileData.age}</span>
        </div>
        
        <button className="edit-profile-btn">
          Edit Profile
        </button>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{profileData.likesReceived}</span>
            <span className="stat-label">Likes</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">5</span>
            <span className="stat-label">Matches</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">Top 10%</span>
            <span className="stat-label">Ranking</span>
          </div>
        </div>

        <div className="profile-section">
          <h3>About Me</h3>
          <p>{profileData.bio}</p>
        </div>

        <div className="profile-section">
          <h3>Interests</h3>
          <div className="tags-container">
            {profileData.interests.map(tag => (
              <div key={tag} className="tag selected">{tag}</div>
            ))}
          </div>
        </div>
        
        <div className="profile-section" style={{marginTop: '40px', paddingBottom: '20px'}}>
          <button className="match-btn btn-secondary" style={{width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)'}}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
