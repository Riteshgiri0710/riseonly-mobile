export function addToEveryItemInArray<T, S>(array: T[], item: S): T[] {
	return array.map((i: T) => ({ ...i, ...item }));
}