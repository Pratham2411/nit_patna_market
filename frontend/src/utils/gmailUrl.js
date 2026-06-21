/**
 * Get the appropriate email compose URL.
 * - Desktop: Opens Gmail compose in a new tab.
 * - Mobile: Uses mailto: which lets Android/iOS offer Gmail as handler.
 */
export function getGmailUrl(email, subject = '', body = '') {
  if (!email) return '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    let url = `mailto:${email}`;
    const params = [];
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return url;
  }
  let url = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}`;
  if (subject) url += `&su=${encodeURIComponent(subject)}`;
  if (body) url += `&body=${encodeURIComponent(body)}`;
  return url;
}

