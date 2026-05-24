const GOOGLE_CALENDAR_COLORS = {
  studyBlue: '9',
  breakRed: '11',
  green: '2',
  yellow: '5',
  purple: '3',
  orange: '6',
  teal: '7',
  pink: '4',
  brown: '6',
  gray: '8',
};

function getCalendarColorId(session) {
  if (session.type === 'study') return GOOGLE_CALENDAR_COLORS.studyBlue;
  if (session.type === 'break') return GOOGLE_CALENDAR_COLORS.breakRed;
  return GOOGLE_CALENDAR_COLORS[session.choreColor] || GOOGLE_CALENDAR_COLORS.gray;
}

export { getCalendarColorId, GOOGLE_CALENDAR_COLORS };
