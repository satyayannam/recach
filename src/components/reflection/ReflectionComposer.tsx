"use client";

import { useEffect, useRef, useState } from "react";

type ReflectionComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  typeValue: string;
  onTypeChange: (value: string) => void;
  typeOptions: Array<{ value: string; label: string; accent?: boolean }>;
  disabled?: boolean;
};

export default function ReflectionComposer({
  value,
  onChange,
  onSubmit,
  typeValue,
  onTypeChange,
  typeOptions,
  disabled
}: ReflectionComposerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const activeOption = typeOptions.find((option) => option.value === typeValue);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      window.addEventListener("mousedown", handleClick);
    }
    return () => {
      window.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="h-10 w-10 rounded-full border border-white/40 text-white/70 text-xs flex items-center justify-center">
        +
      </div>
      <div className="w-full flex-1 rounded-full border border-white/30 bg-white/5 px-4 py-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Post something new..."
            disabled={disabled}
            rows={2}
            className="flex-1 min-w-[140px] bg-transparent text-sm text-white placeholder:text-white/40 resize-none outline-none disabled:opacity-50"
          />
          <div className="relative w-full sm:w-auto" ref={wrapperRef}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen((prev) => !prev)}
              onMouseEnter={() => setOpen(true)}
              className={`w-full sm:w-auto bg-black border border-white/20 text-xs px-3 py-2 rounded-full disabled:opacity-50 ${
                activeOption?.accent ? "text-purple-300" : "text-white"
              }`}
            >
              {activeOption?.label ?? "Select type"}
            </button>
            {open ? (
              <div
                className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-56 rounded-xl border border-white/10 bg-black shadow-lg z-10"
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
              >
                {typeOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => {
                      onTypeChange(option.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 ${
                      option.accent ? "text-purple-300" : "text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="h-10 w-10 rounded-full border border-white/40 text-white disabled:opacity-50"
        aria-label="Send reflection"
      >
        &gt;
      </button>
    </div>
  );
}
