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
