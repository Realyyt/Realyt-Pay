import { ImSpinner2 } from "react-icons/im";
import { PiCaretDown } from "react-icons/pi";
import { FormData, SelectFieldProps } from "../types";
import { InputError } from "./InputError";

export const SelectField = ({
  id,
  label,
  options,
  validation,
  errors,
  register,
  isLoading,
  defaultValue,
  value,
  title,
}: SelectFieldProps) => {
  return (
    <div className="grid flex-1 gap-2">
      <label htmlFor={id} className="font-medium">
        {label} <span className="text-rose-500">*</span>
      </label>
      <div className="relative text-[#CF9FFF]">
        <select
          {...register(id as keyof FormData, validation)}
          id={id}
          defaultValue={defaultValue}
          title={title}
          className={`w-full cursor-pointer appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2 pr-8 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed dark:border-white/20 dark:bg-neutral-900 dark:focus-visible:ring-offset-neutral-900 ${
            value === "" || value === undefined
              ? "text-[#CF9FFF] dark:text-[#CF9FFF]"
              : "text-neutral-900 dark:text-white/80"
          }`}
        >
          <option value="" hidden>
            Select {label.toLowerCase()}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="text-[#CF9FFF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-lg text-[#CF9FFF] dark:text-[#CF9FFF]">
          {isLoading ? (
            <ImSpinner2 className="animate-spin" />
          ) : (
            <PiCaretDown className="text-lg text-gray-400 dark:text-white/50" />
          )}
        </div>
      </div>
      {errors[id as keyof FormData] && (
        <InputError message={errors[id as keyof FormData]?.message} />
      )}
    </div>
  );
};
