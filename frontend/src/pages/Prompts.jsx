import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, useToast } from '../components/UI';
import { getTelegramData } from '../telegram';
import { Plus, X, MessageSquareQuote, Check } from 'lucide-react';

const tg = getTelegramData();

const Prompts = ({ user }) => {
  const [catalog, setCatalog] = useState([]);
  const [items, setItems] = useState([]); // [{question, answer}]
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (!user?.telegramId) return;
    Promise.all([api.promptCatalog(), api.getPrompts(user.telegramId)])
      .then(([c, p]) => {
        setCatalog(c.catalog || []);
        setItems((p.prompts || []).map((x) => ({ question: x.question, answer: x.answer })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const usedQuestions = items.map((i) => i.question);
  const available = catalog.filter((q) => !usedQuestions.includes(q));

  const addPrompt = (q) => {
    setItems((arr) => [...arr, { question: q, answer: '' }]);
    setPicking(false);
  };
  const updateAnswer = (idx, val) => setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, answer: val } : it)));
  const removePrompt = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx));

  const save = () => {
    const clean = items.filter((i) => i.answer.trim());
    setBusy(true);
    api.setPrompts(user.telegramId, clean)
      .then((r) => {
        setItems((r.prompts || []).map((x) => ({ question: x.question, answer: x.answer })));
        tg.hapticNotification('success');
        showToast('پرامپت‌ها ذخیره شد ✅');
      })
      .catch(() => showToast('خطا در ذخیره', 'error'))
      .finally(() => setBusy(false));
  };

  if (loading) return <><PageHeader title="پرامپت‌های پروفایل" /><Loading /></>;

  return (
    <div className="lp-page">
      <PageHeader title="پرامپت‌های پروفایل" subtitle="با پاسخ‌های جذاب، بیشتر دیده شو" />
      {ToastEl}

      <p className="pr-hint">تا ۳ سؤال انتخاب کن و پاسخ بده. این‌ها در پروفایلت به دیگران نمایش داده می‌شوند و بهترین راه شروع گفتگو هستند.</p>

      <div className="pr-list">
        {items.map((it, idx) => (
          <div key={idx} className="pr-card glass-panel">
            <div className="pr-card-head">
              <span className="pr-q"><MessageSquareQuote size={15} /> {it.question}</span>
              <button className="pr-remove" onClick={() => removePrompt(idx)}><X size={16} /></button>
            </div>
            <textarea
              className="pr-answer"
              value={it.answer}
              onChange={(e) => updateAnswer(idx, e.target.value)}
              placeholder="پاسخت را بنویس…"
              maxLength={160}
              rows={2}
            />
            <span className="pr-count">{it.answer.length}/160</span>
          </div>
        ))}

        {items.length < 3 && (
          <button className="pr-add" onClick={() => setPicking(true)}>
            <Plus size={18} /> افزودن پرامپت
          </button>
        )}
      </div>

      <button className="lp-btn lp-btn-primary pr-save" disabled={busy} onClick={save}>
        <Check size={17} /> {busy ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
      </button>

      {picking && (
        <div className="pr-sheet-overlay" onClick={() => setPicking(false)}>
          <div className="pr-sheet glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="pr-sheet-head">
              <h3>یک سؤال انتخاب کن</h3>
              <button onClick={() => setPicking(false)}><X size={20} /></button>
            </div>
            <div className="pr-sheet-list">
              {available.map((q) => (
                <button key={q} className="pr-sheet-item" onClick={() => addPrompt(q)}>
                  <MessageSquareQuote size={15} color="var(--primary-color)" /> {q}
                </button>
              ))}
              {available.length === 0 && <p className="pr-hint" style={{ textAlign: 'center' }}>همه‌ی سؤال‌ها انتخاب شده‌اند.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prompts;
