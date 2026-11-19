import type { Ref } from "react";
import { useActivitySearch } from "../../api/hooks.ts";
import { useDebouncedValue } from "../../lib/useDebouncedValue.ts";
import { Combobox } from "../../ui/index.ts";

export const CNAE_PATTERN = /^\d{4}-\d\/\d{2}$/;
const SEARCH_DEBOUNCE_MS = 250;

type Props = {
  value: string;
  onValueChange: (text: string) => void;
  onBlur?: () => void;
  name?: string;
  ref?: Ref<HTMLInputElement>;
  error?: string | undefined;
};

/** Campo de atividade: digite o código (6201-5/01) ou parte da descrição; a busca espera 250 ms e cancela a anterior. */
export function CnaeField({ value, onValueChange, onBlur, name, ref, error }: Props) {
  const debounced = useDebouncedValue(value, SEARCH_DEBOUNCE_MS);
  // Com o código completo digitado não há o que listar: o cartão da atividade já o confirma.
  const complete = CNAE_PATTERN.test(value.trim());
  const search = useActivitySearch(complete ? "" : debounced);
  const typed = value.trim().length >= 2;
  const waiting = typed && !complete && (debounced !== value || search.isFetching);

  return (
    <Combobox
      label="Atividade (CNAE) *"
      hint="Digite o código, como 6201-5/01, ou parte da descrição."
      {...(name ? { name } : {})}
      {...(ref ? { ref } : {})}
      {...(onBlur ? { onBlur } : {})}
      error={error}
      value={value}
      onValueChange={onValueChange}
      onSelectOption={(option) => onValueChange(option.value)}
      options={(search.data?.itens ?? []).map((activity) => ({ value: activity.cnae, label: `${activity.cnae} — ${activity.descricao}` }))}
      loading={waiting}
      searchable={typed && !complete && !search.isError}
      listboxLabel="Sugestões de atividades"
      loadingMessage="Buscando atividades…"
      emptyMessage="Nenhuma atividade encontrada. Tente o código completo, como 6201-5/01."
    />
  );
}
