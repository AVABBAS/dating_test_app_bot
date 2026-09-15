import axios from 'axios';
import { API_URL } from './telegram';

const idPath = (id, name = 'telegramId') => {
  if (id === undefined || id === null || String(id).trim() === '') throw new Error(`${name} is required`);
  return encodeURIComponent(String(id));
};

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';
};

const request = (method, u, b) => axios({ method, url: `${API_URL}${u}`, data: b, timeout: 15000 }).then((r) => r.data);
const get = (u) => request('get', u);
const post = (u, b = {}) => request('post', u, b);
const put = (u, b = {}) => request('put', u, b);
const del = (u) => axios.delete(`${API_URL}${u}`, { timeout: 15000 }).then((r) => r.data);

export const api = {
  // Core identity / profile
  user: (telegramId) => get(`/user/${idPath(telegramId)}`),
  updateUser: (telegramId, body) => put(`/user/${idPath(telegramId)}`, body),
  deleteUser: (telegramId) => del(`/user/${idPath(telegramId)}`),
  likesCount: (telegramId) => get(`/likes-count/${idPath(telegramId)}`),

  // Discovery / social graph
  discover: (telegramId) => get(`/discover/${idPath(telegramId)}`),
  action: (fromTelegramId, toUserId, action) => post('/action', { fromTelegramId, toUserId, action }),
  matches: (telegramId) => get(`/matches/${idPath(telegramId)}`),
  likesYou: (id) => get(`/likes-you/${idPath(id)}`),
  topPicks: (id) => get(`/top-picks/${idPath(id)}`),

  // Messaging
  messages: (matchId, telegramId) => get(`/messages/${idPath(matchId, 'matchId')}${qs({ telegramId })}`),
  sendMessage: (matchId, telegramId, text) => post(`/messages/${idPath(matchId, 'matchId')}`, { telegramId, text }),

  // Premium / store UI and existing domain endpoints
  premiumPlans: () => get('/premium/plans'),
  premiumStatus: (id) => get(`/premium/status/${idPath(id)}`),
  subscribe: (telegramId, tier) => post('/premium/subscribe', { telegramId, tier }),
  store: (id) => get(`/store/${idPath(id)}`),
  purchase: (telegramId, item) => post('/store/purchase', { telegramId, item }),

  // Stories / profile prompts / verification / gifts
  stories: (id) => get(`/stories/${idPath(id)}`),
  addStory: (telegramId, imageUrl, caption) => post('/stories', { telegramId, imageUrl, caption }),
  viewStory: (storyId, telegramId) => post(`/stories/${idPath(storyId, 'storyId')}/view`, { telegramId }),
  promptCatalog: () => get('/prompts/catalog'),
  getPrompts: (id) => get(`/prompts/${idPath(id)}`),
  setPrompts: (id, prompts) => put(`/prompts/${idPath(id)}`, { prompts }),
  verificationStatus: (id) => get(`/verification/${idPath(id)}`),
  requestVerification: (id) => post(`/verification/${idPath(id)}`, {}),
  gifts: (id) => get(`/gifts/${idPath(id)}`),
  sendGift: (fromTelegramId, toUserId, type, message) => post('/gifts', { fromTelegramId, toUserId, type, message }),

  // Preferences / settings / safety
  getPreferences: (id) => get(`/preferences/${idPath(id)}`),
  setPreferences: (id, p) => put(`/preferences/${idPath(id)}`, p),
  getSettings: (id) => get(`/settings/${idPath(id)}`),
  setSettings: (id, s) => put(`/settings/${idPath(id)}`, s),
  reportReasons: () => get('/report/reasons'),
  report: (fromTelegramId, toUserId, reason) => post('/report', { fromTelegramId, toUserId, reason }),
  block: (fromTelegramId, toUserId) => post('/block', { fromTelegramId, toUserId }),

  // Events / discovery extras
  events: (params) => get(`/events${qs(params)}`),
  event: (id, telegramId) => get(`/events/${idPath(id, 'eventId')}${qs({ telegramId })}`),
  joinEvent: (id, telegramId) => post(`/events/${idPath(id, 'eventId')}/join`, { telegramId }),
  leaveEvent: (id, telegramId) => post(`/events/${idPath(id, 'eventId')}/leave`, { telegramId }),
  leaderboard: () => get('/leaderboard'),
  setPassport: (id, body) => put(`/passport/${idPath(id)}`, body),
  passportCities: () => get('/passport/cities'),
  notifications: (id) => get(`/notifications/${idPath(id)}`),
  readNotifications: (id, notifId) => post(`/notifications/${idPath(id)}/read`, notifId ? { id: notifId } : {}),
};

export { API_URL };
