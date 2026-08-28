import WebApp from '@twa-dev/sdk'

export const initTelegramApp = () => {
  WebApp.ready();
  WebApp.expand();
  // Optional: Set header color to match our dark theme
  if (WebApp.setHeaderColor) {
    WebApp.setHeaderColor('#0f172a');
  }
}

export const getUser = () => {
  if (WebApp.initDataUnsafe?.user) {
    return WebApp.initDataUnsafe.user;
  }
  // Fallback for local development outside Telegram
  return {
    id: 123456,
    first_name: "Test",
    last_name: "User",
    username: "testuser"
  };
}

export const getTelegramId = () => {
  return getUser().id;
}
