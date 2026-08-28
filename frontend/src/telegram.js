export const initTelegramApp = () => {
  const WebApp = window.Telegram?.WebApp;
  if (WebApp) {
    WebApp.ready();
    WebApp.expand();
    if (WebApp.setHeaderColor) {
      WebApp.setHeaderColor('#0f172a');
    }
  } else {
    console.warn('Telegram WebApp not available (running outside Telegram)');
  }
}

export const getUser = () => {
  const WebApp = window.Telegram?.WebApp;
  if (WebApp?.initDataUnsafe?.user) {
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
