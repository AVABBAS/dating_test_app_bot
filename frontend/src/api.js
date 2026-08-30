import axios from 'axios';
import { API_URL } from './telegram';

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
};

const get = (u) => axios.get(`${API_URL}${u}`).then((r) => r.data);
const post = (u, b = {}) => axios.post(`${API_URL}${u}`, b).then((r) => r.data);
const put = (u, b = {}) => axios.put(`${API_URL}${u}`, b).then((r) => r.data);

// Thin wrappers over every API endpoint the new sections use.
export const api = {
  // ── Monetization ──
  premiumPlans: () => get('/premium/plans'),
  premiumStatus: (id) => get(`/premium/status/${id}`),
  subscribe: (telegramId, tier) => post('/premium/subscribe', { telegramId, tier }),
  store: (id) => get(`/store/${id}`),
  purchase: (telegramId, item) => post('/store/purchase', { telegramId, item }),
  likesYou: (id) => get(`/likes-you/${id}`),
  topPicks: (id) => get(`/top-picks/${id}`),

  // ── Profile & discovery ──
  stories: (id) => get(`/stories/${id}`),
  addStory: (telegramId, imageUrl, caption) => post('/stories', { telegramId, imageUrl, caption }),
  viewStory: (storyId, telegramId) => post(`/stories/${storyId}/view`, { telegramId }),
  promptCatalog: () => get('/prompts/catalog'),
  getPrompts: (id) => get(`/prompts/${id}`),
  setPrompts: (id, prompts) => put(`/prompts/${id}`, { prompts }),
  verificationStatus: (id) => get(`/verification/${id}`),
  requestVerification: (id) => post(`/verification/${id}`, {}),
  gifts: (id) => get(`/gifts/${id}`),
  sendGift: (fromTelegramId, toUserId, type, message) => post('/gifts', { fromTelegramId, toUserId, type, message }),

  // ── Settings / safety / filters ──
  getPreferences: (id) => get(`/preferences/${id}`),
  setPreferences: (id, p) => put(`/preferences/${id}`, p),
  getSettings: (id) => get(`/settings/${id}`),
  setSettings: (id, s) => put(`/settings/${id}`, s),
  reportReasons: () => get('/report/reasons'),
  report: (fromTelegramId, toUserId, reason) => post('/report', { fromTelegramId, toUserId, reason }),
  block: (fromTelegramId, toUserId) => post('/block', { fromTelegramId, toUserId }),

  // ── Social & events ──
  events: (params) => get(`/events${qs(params)}`),
  event: (id, telegramId) => get(`/events/${id}${qs({ telegramId })}`),
  joinEvent: (id, telegramId) => post(`/events/${id}/join`, { telegramId }),
  leaveEvent: (id, telegramId) => post(`/events/${id}/leave`, { telegramId }),
  leaderboard: () => get('/leaderboard'),
  setPassport: (id, body) => put(`/passport/${id}`, body),
  passportCities: () => get('/passport/cities'),
  notifications: (id) => get(`/notifications/${id}`),
  readNotifications: (id, notifId) => post(`/notifications/${id}/read`, notifId ? { id: notifId } : {}),
};

export { API_URL };
