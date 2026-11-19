import type { ReactNode } from "react";
import styles from "./CheckboxGroup.module.css";

type Props = {
  legend: string;
  hint?: ReactNode;
  options: ReadonlyArray<{ value: string; label: string }>;
  selected: readonly string[];
  onChange: (selected: string[]) => void;
};

export function CheckboxGroup({ legend, hint, options, selected, onChange }: Props) {
  return (
    <fieldset className={styles["group"]}>
      <legend className={styles["legend"]}>{legend}</legend>
      {hint ? <p className={styles["hint"]}>{hint}</p> : null}
      {options.map((option) => (
        <label key={option.value} className={styles["option"]}>
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={(event) =>
              onChange(event.target.checked ? [...selected, option.value] : selected.filter((v) => v !== option.value))
            }
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
