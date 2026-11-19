import { useId, useState } from "react";
import type { KeyboardEvent, ReactNode, Ref } from "react";
import { cx } from "../lib/ids.ts";
import { describedBy, useFieldIds } from "./Field.tsx";
import fieldStyles from "./TextField.module.css";
import styles from "./Combobox.module.css";

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
}

type Props = {
  label: string;
  name?: string;
  ref?: Ref<HTMLInputElement>;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  /** Texto do campo (controlado). */
  value: string;
  onValueChange: (text: string) => void;
  /** Chamado ao escolher uma opção (clique ou Enter). */
  onSelectOption: (option: ComboboxOption) => void;
  options: readonly ComboboxOption[];
  loading?: boolean;
  /** Quanto o termo já é pesquisável (evita avisar "nenhum resultado" cedo demais). */
  searchable: boolean;
  /** Nome acessível da lista de sugestões (diferente do rótulo do campo). */
  listboxLabel?: string;
  loadingMessage?: string;
  emptyMessage?: string;
  onBlur?: () => void;
};

/**
 * Combobox com lista (padrão APG "list autocomplete"): o foco fica sempre no campo; as setas movem a opção ativa
 * (`aria-activedescendant`), Enter escolhe, Esc fecha e Tab sai. A contagem de resultados é anunciada em região `status`.
 */
export function Combobox({
  label,
  name,
  ref,
  hint,
  error,
  placeholder,
  value,
  onValueChange,
  onSelectOption,
  options,
  loading = false,
  searchable,
  listboxLabel = "Sugestões",
  loadingMessage = "Buscando…",
  emptyMessage = "Nenhum resultado.",
  onBlur,
}: Props) {
  const ids = useFieldIds();
  const base = useId();
  const listboxId = `${base}-listbox`;
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const open = focused && !dismissed && searchable && options.length > 0;
  const empty = searchable && !loading && options.length === 0;
  const status = loading ? loadingMessage : open ? `${options.length} ${options.length === 1 ? "resultado" : "resultados"}. Use as setas para escolher.` : empty ? emptyMessage : "";
  const optionId = (index: number): string => `${base}-option-${index}`;

  const choose = (option: ComboboxOption): void => {
    onSelectOption(option);
    setDismissed(true);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (options.length === 0) return;
      event.preventDefault();
      setDismissed(false);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + options.length) % options.length);
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) choose(option);
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setDismissed(true);
        setActiveIndex(-1);
      }
    } else if (event.key === "Tab") {
      setDismissed(true);
    }
  };

  return (
    <div className={cx(fieldStyles["field"], styles["wrapper"])}>
      <label htmlFor={ids.input} className={fieldStyles["label"]}>{label}</label>
      {hint ? <p id={ids.hint} className={fieldStyles["hint"]}>{hint}</p> : null}
      {error ? (
        <p id={ids.error} className={fieldStyles["error"]}>
          <span aria-hidden="true">⚠ </span>
          <span className="visually-hidden">Erro:</span> {error}
        </p>
      ) : null}
      <div className={cx(fieldStyles["control"], error ? fieldStyles["invalid"] : false)}>
        <input
          ref={ref}
          id={ids.input}
          name={name}
          role="combobox"
          type="text"
          autoComplete="off"
          className={fieldStyles["input"]}
          placeholder={placeholder}
          value={value}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, hint, error)}
          onChange={(event) => {
            setDismissed(false);
            setActiveIndex(-1);
            onValueChange(event.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <ul id={listboxId} role="listbox" aria-label={listboxLabel} hidden={!open} className={styles["listbox"]}>
        {options.map((option, index) => (
          // O teclado é tratado no campo (setas e Enter, APG); o clique é só o atalho do mouse e do toque.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events
          <li
            key={option.value}
            id={optionId(index)}
            role="option"
            aria-selected={index === activeIndex}
            className={cx(styles["option"], index === activeIndex ? styles["active"] : false)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(option)}
          >
            {option.label}
          </li>
        ))}
      </ul>
      <p role="status" className={empty ? styles["empty"] : "visually-hidden"}>{status}</p>
    </div>
  );
}
