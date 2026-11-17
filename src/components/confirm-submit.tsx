"use client";
// A submit button that asks for confirmation before the form is sent (RF14: deleting a ride).
import type { ReactNode } from "react";

export function ConfirmSubmit({ message, className, children }: { message: string; className?: string; children: ReactNode }) {
  return (
    <button
      className={className}
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
