let lang = navigator.language.startsWith('ar') ? 'ar' : 'en';
try { lang = localStorage.getItem('academy-lang') || lang; } catch { /* Use browser language. */ }
if (lang === 'ar') {
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
  document.getElementById('title').textContent = 'أنت غير متصل بالإنترنت';
  document.getElementById('message').textContent = 'اتصل بالإنترنت لفتح دروسك ومزامنة تقدّمك.';
  document.getElementById('retry').textContent = 'حاول مجددًا';
}
document.getElementById('retry').addEventListener('click', () => location.reload());
