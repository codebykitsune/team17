
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getHour = (date: Date): number => {
  return date.getHours();
};

export const toISOString = (date: Date): string => {
  return date.toISOString();
};
