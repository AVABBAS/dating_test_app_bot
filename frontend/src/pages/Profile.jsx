import { useState } from 'react'
import axios from 'axios'
import Onboarding from './Onboarding'

export default function Profile({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <div style={{ paddingBottom: '100px' }}>
        <button 
          className="btn" 
          style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '10px 20px' }}
          onClick={() => setIsEditing(false)}
        >
          ← Cancel
        </button>
        <Onboarding 
          user={user} 
          onComplete={(updatedUser) => {
            onUpdate(updatedUser)
            setIsEditing(false)
          }} 
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <img 
          src={user.photoUrl} 
          alt={user.firstName}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid var(--accent)',
            marginBottom: '16px'
          }}
        />
        <h2 style={{ margin: '0 0 8px 0' }}>{user.firstName} {user.lastName}</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>@{user.username}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Age</span>
            <div style={{ fontWeight: '600' }}>{user.age}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Gender</span>
            <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{user.gender}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Looking For</span>
            <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{user.lookingFor}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bio</span>
            <div style={{ fontWeight: '400', lineHeight: '1.5' }}>{user.bio || "No bio yet."}</div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsEditing(true)}>
          Edit Profile
        </button>
      </div>
    </div>
  )
}
