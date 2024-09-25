function isValidNumber(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") {
    return false;
  }

  const numberRegex = /^-?\d+(\.\d+)?$/;
  if (!numberRegex.test(trimmed)) {
    return false;
  }

  const num = Number(trimmed);
  return !isNaN(num);
}

export { isValidNumber };
