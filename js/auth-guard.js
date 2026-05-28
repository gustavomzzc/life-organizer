// js/auth-guard.js
// Importe este arquivo em todas as páginas protegidas.
// Ele redireciona para login.html se o usuário não estiver autenticado.

import { onAuthChange } from './firebase.js';

// Detecta se estamos numa subpasta (pages/) ou na raiz
const isSubpage = window.location.pathname.includes('/pages/');
const loginPath = isSubpage ? '../login.html' : 'login.html';

// Esconde o conteúdo enquanto verifica auth
document.documentElement.style.visibility = 'hidden';

onAuthChange((user) => {
  if (!user) {
    // Salva a página atual para voltar depois do login
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const folder = isSubpage ? 'pages/' : '';
    window.location.replace(`${loginPath}?redirect=${folder}${currentPage}`);
  } else {
    // Usuário logado — mostra a página
    document.documentElement.style.visibility = 'visible';

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