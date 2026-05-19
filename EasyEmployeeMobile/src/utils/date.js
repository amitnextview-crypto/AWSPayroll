export const todayParts = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    date: now.getDate(),
  };
};

export const formatDisplayDate = item => {
  if (!item) {
    return '-';
  }
  if (item.date && item.month && item.year) {
    return `${item.date}/${item.month}/${item.year}`;
  }
  return String(item);
};

export const formatApiDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoDate = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const datePartsFromDate = date => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  date: date.getDate(),
});

export const buildCycleDates = (cycle, fallbackYear, fallbackMonth, today = todayParts()) => {
  const start = parseIsoDate(cycle?.startDate) || new Date(fallbackYear, fallbackMonth - 1, 1);
  const end = parseIsoDate(cycle?.endDate) || new Date(fallbackYear, fallbackMonth, 0);
  const todayDate = new Date(today.year, today.month - 1, today.date);
  const last = end > todayDate ? todayDate : end;
  if (start > last) {
    return [];
  }

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= last) {
    dates.push(datePartsFromDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};
