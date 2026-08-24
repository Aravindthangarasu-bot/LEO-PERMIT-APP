export function sortByNewest<T>(items: T[], getTimestamp: (item: T) => string | undefined): T[] {
  return [...items].sort((left, right) => {
    const rightTime = Date.parse(getTimestamp(right) ?? '');
    const leftTime = Date.parse(getTimestamp(left) ?? '');
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });
}
