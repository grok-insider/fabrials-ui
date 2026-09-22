export type StyledProps<T> = Omit<T, "className"> & { className?: string };

export function classes(
  ...values: Array<string | false | null | undefined | ((...args: never[]) => string | undefined)>
) {
  return values.filter((value): value is string => typeof value === "string" && value.length > 0).join(" ");
}
