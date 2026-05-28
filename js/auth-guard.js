import { onAuthChange } from './firebase.js';

const isSubpage = window.location.pathname.includes('/pages/');
const loginPath = isSubpage ? '../login.html' : 'login.html';

// Deixa invisível até confirmar auth
document.documentElement.style.opacity = '0';
document.documentElement.style.transition = 'opacity 0.15s';

onAuthChange((user) => {
  if (!user) {
    window.location.replace(loginPath);
  } else {
    // Mostra suavemente
    document.documentElement.style.opacity = '1';

    // Atualiza avatar no header se existir
    const avatarEl = document.getElementById('header-avatar');
    if (avatarEl && user.photoURL) {
      avatarEl.style.backgroundImage = `url(${user.photoURL})`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.style.borderRadius = '50%';
      avatarEl.textContent = '';
    }
  }
});