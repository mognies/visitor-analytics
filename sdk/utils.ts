export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function getVisitorId(): string {
  const storageKey = "visitor_id";
  let visitorId = localStorage.getItem(storageKey);

  if (!visitorId) {
    visitorId = generateId();
    localStorage.setItem(storageKey, visitorId);
  }

  return visitorId;
}

export function getCurrentPath(): string {
  return window.location.pathname;
}
