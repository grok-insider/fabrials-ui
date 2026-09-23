"use client";
import { useId } from "react";
import { CalendarDays } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@fabrials/ui";
import { Calendar } from "@/components/ui/calendar";
export interface DateRangeValue {
  from: string;
  to: string;
}
function day(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
export function DateRangePicker({
  value,
  onChange,
  min,
  required = false,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  min?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={`${id}-from`}>Start date</Label>
          <Input
            id={`${id}-from`}
            name="from"
            type="date"
            value={value.from}
            min={min}
            required={required}
            onChange={(e) =>
              onChange({
                from: e.target.value,
                to: value.to && value.to < e.target.value ? "" : value.to,
              })
            }
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={`${id}-to`}>End date</Label>
          <Input
            id={`${id}-to`}
            name="to"
            type="date"
            value={value.to}
            min={value.from || min}
            required={required}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </div>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="Open calendar"
              />
            }
          >
            <CalendarDays className="size-4" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={{
                from: value.from
                  ? new Date(`${value.from}T12:00:00`)
                  : undefined,
                to: value.to ? new Date(`${value.to}T12:00:00`) : undefined,
              }}
              onSelect={(range) =>
                onChange({
                  from: range?.from ? day(range.from) : "",
                  to: range?.to ? day(range.to) : "",
                })
              }
              disabled={
                min ? { before: new Date(`${min}T00:00:00`) } : undefined
              }
            />
          </PopoverContent>
        </Popover>
      </div>
      {value.to && value.from > value.to && (
        <p role="alert" className="text-sm text-destructive">
          End date must follow start date.
        </p>
      )}
    </div>
  );
}
