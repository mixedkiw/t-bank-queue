document.addEventListener('DOMContentLoaded', () => {

  const urlParams = new URLSearchParams(window.location.search);
  const origin = urlParams.get('origin') || 'default';

  const titleMap = {
    '1': 'event #1',
    '2': 'event #2',
    '3': 'event #3',
    '4': 'event #4',
    '5': 'event #5'
  };

  if (titleMap[origin]) {
    document.title = titleMap[origin];
    const heading = document.querySelector('h1');
    if (heading) heading.textContent = titleMap[origin];
  }

  const form = document.querySelector('.registration-form');
  if (form) {
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'origin';
    hiddenInput.value = origin;
    form.appendChild(hiddenInput);
  }
});
