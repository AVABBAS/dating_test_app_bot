import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../telegram';

const Onboarding = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.firstName || user?.first_name || '',
    age: user?.age || '',
    gender: user?.gender || '',
    bio: user?.bio || '',
    interests: user?.interests || [],
    lookingFor: user?.lookingFor || 'everyone',
  });
  const totalSteps = 3;
  const interestsList = ['🎵 موسیقی', '🎬 فیلم', '✈️ سفر', '📚 کتاب', '🏋️ ورزش', '🎨 هنر', '🍳 آشپزی', '📸 عکاسی', '🎮 بازی', '🧘 یوگا', '⚽ فوتبال', '🐱 حیوانات', '☕ قهوه', '🏔️ طبیعت', '💻 تکنولوژی', '🎭 تئاتر'];

  const handleNext = async () => {
    setError('');
    if (step < totalSteps) {
      setStep((s) => s + 1);
      return;
    }
    if (!user?.telegramId || saving) return;
    setSaving(true);
    try {
      await axios.put(`${API_URL}/user/${user.telegramId}`, {
        age: Number(formData.age), gender: formData.gender, bio: formData.bio,
        interests: formData.interests, lookingFor: formData.lookingFor, firstName: formData.name.trim(),
      });
      onComplete();
    } catch (err) {
      console.error('Onboarding failed:', err);
      setError('ذخیره اطلاعات انجام نشد. اتصال را بررسی و دوباره تلاش کن.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => { if (!saving && step > 1) setStep((s) => s - 1); };
  const toggleInterest = (interest) => setFormData((current) => ({ ...current, interests: current.interests.includes(interest) ? current.interests.filter((i) => i !== interest) : current.interests.length < 5 ? [...current.interests, interest] : current.interests }));
  const age = Number(formData.age);
  const canGoNext = step !== 1 || (formData.name.trim().length > 0 && age >= 18 && age <= 80 && !!formData.gender);

  return (
    <div className="onboarding-page">
      <div className="progress-bar-container">{[...Array(totalSteps)].map((_, i) => <div key={i} className="progress-segment"><div className={`progress-fill ${step > i ? 'filled' : ''}`} /></div>)}</div>
      {step === 1 && <div className="step-container"><h2 className="step-title">اطلاعات پایه</h2><p className="step-subtitle">درباره خودت بگو.</p><div className="input-group"><label>اسم</label><input type="text" className="form-input" placeholder="اسمت چیه؟" value={formData.name} maxLength={80} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div><div className="input-group"><label>سن</label><input type="number" className="form-input" placeholder="چند سالته؟" min="18" max="80" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} /></div><div className="input-group"><label>جنسیت</label><div className="gender-options">{[{ value: 'male', label: '👨 مرد' }, { value: 'female', label: '👩 زن' }, { value: 'other', label: '🌈 سایر' }].map((opt) => <button type="button" key={opt.value} className={`gender-opt ${formData.gender === opt.value ? 'active' : ''}`} onClick={() => setFormData({ ...formData, gender: opt.value })}>{opt.label}</button>)}</div></div></div>}
      {step === 2 && <div className="step-container"><h2 className="step-title">بیو و علاقه‌مندی‌ها</h2><p className="step-subtitle">چی تو رو منحصربه‌فرد می‌کنه؟</p><div className="input-group"><label>بیو</label><textarea className="form-input" rows={3} maxLength={500} placeholder="چند جمله درباره خودت بنویس..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} /></div><div className="input-group"><label>علاقه‌مندی‌ها <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>(حداکثر ۵ تا)</span></label><div className="tags-container">{interestsList.map((tag) => <button type="button" key={tag} className={`tag ${formData.interests.includes(tag) ? 'selected' : ''}`} onClick={() => toggleInterest(tag)}>{tag}</button>)}</div></div></div>}
      {step === 3 && <div className="step-container"><h2 className="step-title">ترجیحات</h2><p className="step-subtitle">دنبال چه کسی می‌گردی؟</p><div className="input-group"><label>دنبال</label><div className="gender-options">{[{ value: 'men', label: '👨 مرد' }, { value: 'women', label: '👩 زن' }, { value: 'everyone', label: '💞 همه' }].map((opt) => <button type="button" key={opt.value} className={`gender-opt ${formData.lookingFor === opt.value ? 'active' : ''}`} onClick={() => setFormData({ ...formData, lookingFor: opt.value })}>{opt.label}</button>)}</div></div><div className="ob-summary"><div className="ob-summary-info"><strong>{formData.name || 'بدون اسم'}</strong>، {formData.age || '?'} ساله<div className="ob-summary-tags">{formData.interests.slice(0, 3).map((t, i) => <span key={i} className="card-tag">{t}</span>)}</div></div></div></div>}
      {error && <p role="alert" style={{ color: '#ff8793', textAlign: 'center' }}>{error}</p>}
      <div className="onboarding-buttons">
        {step > 1 && <button type="button" className="match-btn btn-secondary" style={{ width: '30%' }} onClick={handleBack} disabled={saving}>برگشت</button>}
        <button type="button" className="match-btn btn-primary" style={{ flex: 1, margin: 0, opacity: canGoNext && !saving ? 1 : 0.5 }} onClick={handleNext} disabled={!canGoNext || saving}>{saving ? 'در حال ذخیره…' : step === totalSteps ? 'شروع کن ✨' : 'بعدی'}</button>
      </div>
    </div>
  );
};
export default Onboarding;
