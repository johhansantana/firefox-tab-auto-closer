document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  browser.storage.local.get(['timeout', 'timeUnit']).then((result) => {
    if (result.timeout) {
      document.getElementById('timeout').value = result.timeout;
    }
    if (result.timeUnit) {
      document.getElementById('timeUnit').value = result.timeUnit;
    }
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', () => {
    const timeout = document.getElementById('timeout').value;
    const timeUnit = document.getElementById('timeUnit').value;

    browser.storage.local.set({
      timeout: timeout,
      timeUnit: timeUnit
    }).then(() => {
      // Notify background script to update timer
      browser.runtime.sendMessage({
        action: 'updateSettings',
        timeout: timeout,
        timeUnit: timeUnit
      });

      // Show success message
      const status = document.getElementById('status');
      status.textContent = 'Settings saved successfully!';
      status.className = 'status success';
      status.style.display = 'block';

      setTimeout(() => {
        status.style.display = 'none';
      }, 2000);
    });
  });
});
