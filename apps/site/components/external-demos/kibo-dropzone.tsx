"use client";
// Preview written by Fabrials for Kibo UI's dropzone. Files stay in the browser.
import { useState } from "react";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/external/kibo/dropzone";

export default function KiboDropzoneDemo() {
  const [files, setFiles] = useState<File[] | undefined>();
  return (
    <Dropzone
      accept={{ "image/*": [] }}
      maxFiles={3}
      maxSize={1024 * 1024 * 5}
      onDrop={(accepted) => setFiles(accepted)}
      src={files}
      className="w-full max-w-md"
    >
      <DropzoneEmptyState />
      <DropzoneContent />
    </Dropzone>
  );
}
