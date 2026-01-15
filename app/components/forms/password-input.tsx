"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  name: string;
  label: string;
  fieldClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  showLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({
  id,
  name,
  label,
  fieldClassName,
  labelClassName,
  containerClassName,
  inputClassName,
  buttonClassName,
  showLabel = "Show password",
  hideLabel = "Hide password",
  ...inputProps
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={fieldClassName}>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <div className={containerClassName ?? "relative"}>
        <input
          {...inputProps}
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          className={inputClassName}
        />
        <button
          type="button"
          className={buttonClassName}
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? hideLabel : showLabel}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
