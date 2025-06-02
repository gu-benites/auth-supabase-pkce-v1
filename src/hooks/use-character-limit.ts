
import { ChangeEvent, useState, useCallback } from "react";

type UseCharacterLimitProps = {
  maxLength: number;
  initialValue?: string;
};

export function useCharacterLimit({ maxLength, initialValue = "" }: UseCharacterLimitProps) {
  const [value, setValue] = useState(initialValue);
  const [characterCount, setCharacterCount] = useState(initialValue.length);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
      setCharacterCount(newValue.length);
    }
  }, [maxLength]);

  // Function to programmatically set value, e.g., from form reset or initial load
  const updateValue = useCallback((newValue: string) => {
    if (newValue.length <= maxLength) {
      setValue(newValue);
      setCharacterCount(newValue.length);
    } else {
      const truncatedValue = newValue.substring(0, maxLength);
      setValue(truncatedValue);
      setCharacterCount(maxLength);
    }
  }, [maxLength]);


  return {
    value,
    characterCount,
    handleChange,
    updateValue, 
    maxLength,
  };
}

    