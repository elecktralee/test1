import React from "react";

interface ScaleOption {
  value: number;
  label: string;
}

interface LikertQuestionProps {
  index: number;
  text: string;
  name: string;
  scale: ScaleOption[];
  value: number | null;
  onChange: (value: number) => void;
  hasError?: boolean;
}

export function LikertQuestion({
  index,
  text,
  name,
  scale,
  value,
  onChange,
  hasError = false,
}: LikertQuestionProps) {
  return (
    <div
      className={`rounded-xl border p-4 mb-3 transition-all ${
        value !== null
          ? "border-indigo-200 bg-indigo-50/40"
          : hasError
          ? "border-red-300 bg-red-50/30"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-sm text-gray-800 mb-3 leading-relaxed">
        <span className="font-semibold text-indigo-600 mr-2">{index}.</span>
        {text}
      </p>

      <div className={`grid gap-2 ${scale.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`}>
        {scale.map((option) => {
          const isSelected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-all text-center min-h-[56px] select-none ${
                isSelected
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className={`text-lg font-bold ${isSelected ? "text-white" : "text-gray-400"}`}>
                {option.value}
              </span>
              <span className="text-[10px] font-medium leading-tight mt-0.5">{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
