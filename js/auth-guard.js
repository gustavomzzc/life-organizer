import { onAuthChange } from './firebase.js';

const isSubpage = window.location.pathname.includes('/pages/');
const loginPath = isSubpage ? '../login.html' : 'login.html';

// Se já logou antes nessa sessão, não esconde a página
const jaLogou = sessionStorage.getItem('logado');
if (!jaLogou) {
  document.documentElement.style.opacity = '0';
  document.documentElement.style.transition = 'opacity 0.15s';
}

onAuthChange((user) => {
  if (!user) {
    sessionStorage.removeItem('logado');
    window.location.replace(loginPath);
  } else {
    sessionStorage.setItem('logado', '1');
    document.documentElement.style.opacity = '1';

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