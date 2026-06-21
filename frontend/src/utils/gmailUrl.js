/**
 * Get the appropriate email compose URL.
 * - Desktop: Opens Gmail compose in a new tab.
 * - Mobile: Uses mailto: which lets Android/iOS offer Gmail as handler.
 */
export function getGmailUrl(email) {
  if (!email) return '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    return `mailto:${email}`;
  }
  return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}`;
}

