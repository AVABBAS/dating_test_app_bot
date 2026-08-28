import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../telegram';
import { Camera, CheckCircle } from 'lucide-react';

const Onboarding = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);

  // Pre-fill with Telegram photo if available (fetched by server)
  const [formData, setFormData] = useState({
    photoUrl: user?.photoUrl || '',
    name: user?.firstName || user?.first_name || '',
    age: user?.age || '',
    gender: user?.gender || 'female',
    bio: user?.bio || '',
    interests: user?.interests || [],
    lookingFor: user?.lookingFor || 'everyone',
  });

  // For photo editing: toggle between telegram photo and custom URL
  const [useCustomPhoto, setUseCustomPhoto] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  const telegramPhoto = user?.photoUrl || '';
  const effectivePhoto = useCustomPhoto ? customPhotoUrl : (formData.photoUrl || telegramPhoto);

  const totalSteps = 4;

  const interestsList = [
    '🎵 موسیقی', '🎬 فیلم', '✈️ سفر', '📚 کتاب', '🏋️ ورزش',
    '🎨 هنر', '🍳 آشپزی', '📸 عکاسی', '🎮 بازی', '🧘 یوگا',
    '⚽ فوتبال', '🐱 حیوانات', '☕ قهوه', '🏔️ طبیعت', '💻 تکنولوژی', '🎭 تئاتر'
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
      const finalPhoto = useCustomPhoto ? customPhotoUrl : formData.photoUrl;
      await axios.put(`${API_URL}/user/${user?.telegramId || '123'}`, {
        photoUrl: finalPhoto,
        age: formData.age,
        gender: formData.gender,
        bio: formData.bio,
        interests: formData.interests,
        lookingFor: formData.lookingFor,
        firstName: formData.name,
      });
      onComplete();
    } catch (err) {
      console.error('Onboarding failed:', err);
      onComplete();
    }
  };

  const canGoNext = () => {
    if (step === 1) return effectivePhoto.length > 0;
    if (step === 2) return formData.name.trim().length > 0 && formData.age > 0;
    return true;
  };

  return (
    <div className="onboarding-page">
      {/* Progress Bar */}
      <div className="progress-bar-container">
        {[...Array(totalSteps)].map((_, i) => (
          <div key={i} className="progress-segment">
            <div className={`progress-fill ${step > i ? 'filled' : ''}`} />
          </div>
        ))}
      </div>

      {/* ── Step 1: Photo ── */}
      {step === 1 && (
        <div className="step-container">
          <h2 className="step-title">عکس پروفایل</h2>
          <p className="step-subtitle">بهترین تصویر خودت رو انتخاب کن.</p>

          {/* Photo Preview */}
          <div className="ob-photo-wrapper">
            {effectivePhoto ? (
              <img src={effectivePhoto} alt="Preview" className="ob-photo-preview" />
            ) : (
              <div className="ob-photo-empty">
                <Camera size={40} color="var(--text-secondary)" />
                <span>عکسی انتخاب نشده</span>
              </div>
            )}

            {/* Auto badge */}
            {telegramPhoto && !useCustomPhoto && (
              <div className="ob-auto-badge">
                <CheckCircle size={14} />
                عکس تلگرام
              </div>
            )}
          </div>

          {/* Use telegram photo */}
          {telegramPhoto && (
            <div className="ob-photo-options">
              <button
                className={`ob-photo-opt ${!useCustomPhoto ? 'active' : ''}`}
                onClick={() => setUseCustomPhoto(false)}
              >
                📷 استفاده از عکس تلگرام
              </button>
              <button
                className={`ob-photo-opt ${useCustomPhoto ? 'active' : ''}`}
                onClick={() => setUseCustomPhoto(true)}
              >
                🔗 آدرس عکس دلخواه
              </button>
            </div>
          )}

          {/* Custom URL input */}
          {(useCustomPhoto || !telegramPhoto) && (
            <div className="input-group" style={{ marginTop: 12 }}>
              <label>آدرس عکس (URL)</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://..."
                value={useCustomPhoto ? customPhotoUrl : formData.photoUrl}
                onChange={e => {
                  if (useCustomPhoto) setCustomPhotoUrl(e.target.value);
                  else setFormData({ ...formData, photoUrl: e.target.value });
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Basic Info ── */}
      {step === 2 && (
        <div className="step-container">
          <h2 className="step-title">اطلاعات پایه</h2>
          <p className="step-subtitle">درباره خودت بگو.</p>

          <div className="input-group">
            <label>اسم</label>
            <input
              type="text"
              className="form-input"
              placeholder="اسمت چیه؟"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>سن</label>
            <input
              type="number"
              className="form-input"
              placeholder="چند سالته؟"
              min="18"
              max="80"
              value={formData.age}
              onChange={e => setFormData({ ...formData, age: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>جنسیت</label>
            <div className="gender-options">
              {[
                { value: 'male', label: '👨 مرد' },
                { value: 'female', label: '👩 زن' },
                { value: 'other', label: '🌈 سایر' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`gender-opt ${formData.gender === opt.value ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, gender: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Bio & Interests ── */}
      {step === 3 && (
        <div className="step-container">
          <h2 className="step-title">بیو و علاقه‌مندی‌ها</h2>
          <p className="step-subtitle">چی تو رو منحصربه‌فرد می‌کنه؟</p>

          <div className="input-group">
            <label>بیو</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="چند جمله درباره خودت بنویس..."
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>علاقه‌مندی‌ها <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>(حداکثر ۵ تا)</span></label>
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

      {/* ── Step 4: Preferences ── */}
      {step === 4 && (
        <div className="step-container">
          <h2 className="step-title">ترجیحات</h2>
          <p className="step-subtitle">دنبال چه کسی می‌گردی؟</p>

          <div className="input-group">
            <label>دنبال</label>
            <div className="gender-options">
              {[
                { value: 'men', label: '👨 مرد' },
                { value: 'women', label: '👩 زن' },
                { value: 'everyone', label: '💞 همه' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`gender-opt ${formData.lookingFor === opt.value ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, lookingFor: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary preview */}
          <div className="ob-summary">
            <img src={effectivePhoto} alt="" className="ob-summary-photo" />
            <div className="ob-summary-info">
              <strong>{formData.name || 'بدون اسم'}</strong>، {formData.age || '?'} ساله
              <div className="ob-summary-tags">
                {formData.interests.slice(0, 3).map((t, i) => (
                  <span key={i} className="card-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav Buttons */}
      <div className="onboarding-buttons">
        {step > 1 && (
          <button className="match-btn btn-secondary" style={{ width: '30%' }} onClick={handleBack}>
            برگشت
          </button>
        )}
        <button
          className="match-btn btn-primary"
          style={{ flex: 1, margin: 0, opacity: canGoNext() ? 1 : 0.5 }}
          onClick={handleNext}
          disabled={!canGoNext()}
        >
          {step === totalSteps ? 'شروع کن ✨' : 'بعدی'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
