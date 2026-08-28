import { useState } from 'react'
import axios from 'axios'

const API_URL = window.location.origin + '/api'

export default function Onboarding({ user, onComplete }) {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    lookingFor: 'female',
    bio: '',
    photoUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&q=80' // default placeholder
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.put(`${API_URL}/user/${user.telegramId}`, formData)
      onComplete(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="glass-panel animate-slide-up" style={{ margin: 'auto', marginTop: '20px' }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Complete Your Profile</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Age</label>
          <input 
            type="number" 
            name="age"
            className="input-field" 
            value={formData.age} 
            onChange={handleChange} 
            required 
            min="18" 
            max="100"
          />
        </div>

        <div className="input-group">
          <label className="input-label">I am a</label>
          <select name="gender" className="input-field" value={formData.gender} onChange={handleChange}>
            <option value="male">Man</option>
            <option value="female">Woman</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Looking for</label>
          <select name="lookingFor" className="input-field" value={formData.lookingFor} onChange={handleChange}>
            <option value="female">Women</option>
            <option value="male">Men</option>
            <option value="both">Everyone</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Bio</label>
          <textarea 
            name="bio"
            className="input-field" 
            value={formData.bio} 
            onChange={handleChange}
            rows="3"
            placeholder="Tell us about yourself..."
          ></textarea>
        </div>
        
        <div className="input-group">
          <label className="input-label">Photo URL</label>
          <input 
            type="url" 
            name="photoUrl"
            className="input-field" 
            value={formData.photoUrl} 
            onChange={handleChange} 
            required
            placeholder="https://..."
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          Start Swiping ✨
        </button>
      </form>
    </div>
  )
}
