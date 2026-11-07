export const theme = {
  red: '#e60012',
  redDisabled: '#f08a93',
  inputBg: '#e8f0fe',
  bg: '#fff8f8',
  card: '#ffffff',
  text: '#111827',
  textMuted: '#475569',
  textFaint: '#94a3b8',
  border: '#e5e7eb',
  chipBg: '#f1f5f9',
  low: '#16a34a',
  medium: '#d97706',
  high: '#dc2626',
};

export const severityColor = (s?: string) =>
  s === 'High' ? theme.high : s === 'Low' ? theme.low : theme.medium;