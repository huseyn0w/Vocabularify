const secondsInput = document.getElementById('seconds');
const saveButton = document.getElementById('saveButton');

// Prefill with the currently active interval.
window.vocab.getIntervalMs().then(intervalMs => {
  secondsInput.value = Math.round(intervalMs / 1000);
});

saveButton.addEventListener('click', async () => {
  const seconds = Number(secondsInput.value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return;
  }
  await window.vocab.setCustomSpeed(seconds);
  window.close();
});
