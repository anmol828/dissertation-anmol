export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export const isValidPhone = (value) =>
  !value || /^[0-9+\-\s]{7,20}$/.test(String(value).trim());

export const isValidOptionalUrl = (value) =>
  !value || /^https?:\/\/.+/i.test(String(value).trim());

export const isStrongEnoughPassword = (value) =>
  String(value || "").trim().length >= 6;

export const hasNonEmptyValue = (value) => String(value || "").trim().length > 0;

export const hasPositiveNumber = (value) => Number(value) > 0;

export const hasValidTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return false;
  }

  return startTime < endTime;
};
