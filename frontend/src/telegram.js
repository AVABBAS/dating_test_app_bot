import axios from 'axios';

export const getTelegramData = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    // Tell Telegram app we are ready
    webApp.ready();
    // Expand to full height
    webApp.expand();
    // Attach the signed initData to every API call so the backend can verify
    // the caller's real Telegram identity (prevents impersonation).
    if (webApp.initData) {
      axios.defaults.headers.common['x-telegram-init-data'] = webApp.initData;
    }
    // Return relevant data
    return {
      initData: webApp.initData,
      initDataUnsafe: webApp.initDataUnsafe,
      user: webApp.initDataUnsafe?.user || null,
      themeParams: webApp.themeParams,
      colorScheme: webApp.colorScheme,
      close: () => webApp.close(),
      sendData: (data) => webApp.sendData(data),
      showAlert: (msg) => webApp.showAlert(msg),
      showConfirm: (msg, callback) => webApp.showConfirm(msg, callback),
      showPopup: (params, callback) => webApp.showPopup(params, callback),
      hapticImpact: (style = 'medium') => webApp.HapticFeedback?.impactOccurred(style),
      hapticNotification: (type = 'success') => webApp.HapticFeedback?.notificationOccurred(type),
    };
  }

  // Fallback for local development outside Telegram
  return {
    initData: '',
    initDataUnsafe: {},
    user: {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'en'
    },
    themeParams: {},
    colorScheme: 'dark',
    close: () => console.log('Close WebApp'),
    sendData: (data) => console.log('Send Data:', data),
    showAlert: (msg) => alert(msg),
    showConfirm: (msg, cb) => { if(confirm(msg)) cb(true); else cb(false); },
    showPopup: (params, cb) => { alert(params.message); if (cb) cb('ok'); },
    hapticImpact: () => {},
    hapticNotification: () => {},
  };
};

export const API_URL = window.location.origin + '/api';
