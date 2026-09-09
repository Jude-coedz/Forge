export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function now() {
  return Date.now();
}

export function clock(ts = now()) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
