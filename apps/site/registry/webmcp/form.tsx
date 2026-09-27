"use client";
import { useRef, useState, type ComponentProps, type FormEvent } from "react";
import { errorMessage } from "@/registry/mcp/types";
type AgentSubmit = SubmitEvent & {
  agentInvoked?: boolean;
  respondWith?: (value: Promise<unknown>) => void;
};
export function WebMCPForm({
  toolName,
  toolDescription,
  autoSubmit = false,
  onExecute,
  children,
  ...props
}: Omit<ComponentProps<"form">, "onSubmit"> & {
  toolName: string;
  toolDescription: string;
  autoSubmit?: boolean;
  onExecute: (
    data: FormData,
    context: { agentInvoked: boolean },
  ) => Promise<unknown>;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const native = event.nativeEvent as AgentSubmit;
    if (busy.current) {
      if (native.agentInvoked)
        native.respondWith?.(
          Promise.resolve({ error: "A submission is already running." }),
        );
      return;
    }
    busy.current = true;
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget, native.submitter);
    const response = Promise.resolve()
      .then(() =>
        onExecute(data, { agentInvoked: native.agentInvoked === true }),
      )
      .catch((e) => {
        setError(errorMessage(e));
        return { error: errorMessage(e) };
      })
      .finally(() => {
        busy.current = false;
        setPending(false);
      });
    if (native.agentInvoked) native.respondWith?.(response);
  }
  return (
    <form
      {...props}
      {...{
        toolname: toolName,
        tooldescription: toolDescription,
        ...(autoSubmit ? { toolautosubmit: "" } : {}),
      }}
      onSubmit={submit}
      aria-busy={pending}
    >
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
export function toolField(description: string) {
  return { toolparamdescription: description };
}
