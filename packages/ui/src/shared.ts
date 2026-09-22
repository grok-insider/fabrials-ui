export type StyledProps<T> = Omit<T, "className"> & { className?: string };

export function classes(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}
