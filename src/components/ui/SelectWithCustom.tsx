"use client";

import { useState, useEffect } from "react";

const CUSTOM_SENTINEL = "__custom__";

type Option = string | { value: string; label: string };

export interface SelectWithCustomProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  /** Text for the "Custom…" option (default "Custom…"). */
  customLabel?: string;
  /** Placeholder for the custom text input. */
  customPlaceholder?: string;
  className?: string;
  inputClassName?: string;
  /** Option background class (for dark dropdowns), e.g. "bg-[#141414]". */
  optionClassName?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * A <select> that offers a "Custom…" option. When chosen, a free-text input
 * appears and its value becomes the field value — so users can enter a value
 * not in the predefined list. Any value not in the list is treated as custom.
 */
export function SelectWithCustom({
  value,
  onChange,
  options,
  customLabel = "Custom…",
  customPlaceholder = "Enter a custom value",
  className,
  inputClassName,
  optionClassName,
  id,
  disabled,
}: SelectWithCustomProps) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const optionValues = normalized.map((o) => o.value);

  const [customMode, setCustomMode] = useState<boolean>(
    () => value !== "" && !optionValues.includes(value)
  );

  // If the value gets set externally to something not in the list, switch to
  // custom mode (e.g. when editing an existing item with a custom value).
  useEffect(() => {
    if (value !== "" && !optionValues.includes(value)) setCustomMode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const selectValue = customMode || !optionValues.includes(value) ? CUSTOM_SENTINEL : value;

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === CUSTOM_SENTINEL) {
      setCustomMode(true);
      onChange("");
    } else {
      setCustomMode(false);
      onChange(v);
    }
  };

  return (
    <div className="space-y-2">
      <select
        id={id}
        value={selectValue}
        onChange={handleSelect}
        disabled={disabled}
        className={className}
      >
        {normalized.map((o) => (
          <option key={o.value} value={o.value} className={optionClassName}>
            {o.label}
          </option>
        ))}
        <option value={CUSTOM_SENTINEL} className={optionClassName}>
          {customLabel}
        </option>
      </select>
      {(customMode || selectValue === CUSTOM_SENTINEL) && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={customPlaceholder}
          disabled={disabled}
          className={inputClassName ?? className}
          autoFocus
        />
      )}
    </div>
  );
}
