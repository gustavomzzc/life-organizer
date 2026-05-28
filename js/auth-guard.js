import { onAuthChange } from './firebase.js';
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const isSubpage = window.location.pathname.includes('/pages/');
const loginPath = isSubpage ? '../login.html' : 'login.html';

// Se já tem usuário em cache, mostra imediatamente sem esconder
const auth = getAuth();
if (!auth.currentUser) {
  document.documentElement.style.opacity = '0';
}
document.documentElement.style.transition = 'opacity 0.15s';

onAuthChange((user) => {
  if (!user) {
    window.location.replace(loginPath);
  } else {
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