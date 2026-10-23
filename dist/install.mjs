export function getInstallPlatform({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  if (/iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'other';
}

export async function requestNativeInstall(prompt) {
  if (typeof prompt?.prompt !== 'function') return 'unavailable';
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'unavailable';
  }
}
