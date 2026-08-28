import { useState, useEffect } from 'react'
import axios from 'axios'
import { WebApp } from '@twa-dev/sdk'

const API_URL = '/api'

export default function Matches({ user }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const res = await axios.get(`${API_URL}/matches/${user.telegramId}`)
      setMatches(res.data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const handleMessage = (username) => {
    if (username) {
      window.open(`https://t.me/${username}`, '_blank');
    } else {
      alert("This user doesn't have a public username.");
    }
  }

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading matches...</div>
  
  if (matches.length === 0) return (
    <div style={{textAlign: 'center', marginTop: '50px', padding: '20px'}}>
      <h3>No matches yet 😢</h3>
      <p style={{color: 'var(--text-secondary)'}}>Keep swiping to find your match!</p>
    </div>
  )

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <h2 style={{ marginBottom: '20px' }}>Your Matches</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {matches.map(match => (
          <div key={match.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
            <img 
              src={match.photoUrl} 
              alt={match.firstName} 
              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{match.firstName || match.username}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Matched with you!</p>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ padding: '8px 16px', fontSize: '14px' }}
              onClick={() => handleMessage(match.username)}
            >
              Chat
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
