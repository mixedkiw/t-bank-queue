document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const eventName = urlParams.get('event') || '';

  if (eventName) {
    document.title = `Регистрация на ${eventName}`;
    const heading = document.querySelector('h1');
    if (heading) heading.textContent = `Регистрация на ${eventName}`;
  }

  const form = document.querySelector('.registration-form');
  if (form) {
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'event';
    hiddenInput.value = eventName;
    form.appendChild(hiddenInput);
  }
});