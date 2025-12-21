const JST_TIME_ZONE = "Asia/Tokyo";

type JstParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

const jstDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: JST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

const getJstParts = (date: Date): JstParts => {
  const parts = jstDateTimeFormatter.formatToParts(date);
  const map: Partial<JstParts> = {};

  for (const part of parts) {
    if (part.type === "year") map.year = part.value;
    if (part.type === "month") map.month = part.value;
    if (part.type === "day") map.day = part.value;
    if (part.type === "hour") map.hour = part.value;
    if (part.type === "minute") map.minute = part.value;
    if (part.type === "second") map.second = part.value;
  }

  return map as JstParts;
};

export const formatJstDateKey = (date: Date): string => {
  const { year, month, day } = getJstParts(date);
  return `${year}-${month}-${day}`;
};

export const getJstHour = (date: Date): number => {
  const { hour } = getJstParts(date);
  return Number(hour);
};

export const toJstISOString = (date: Date): string => {
  const { year, month, day, hour, minute, second } = getJstParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`;
};
