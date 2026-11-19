import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { FieldProblem, SimulationRequest } from "../../api/types.ts";
import { useActivity } from "../../api/hooks.ts";
import { Button, CheckboxGroup, MoneyField, PercentField, Select, TextField } from "../../ui/index.ts";
import { ActivityCard } from "./ActivityCard.tsx";
import { CNAE_PATTERN, CnaeField } from "./CnaeField.tsx";
import { ErrorSummary, type SummaryItem } from "./ErrorSummary.tsx";
import { approximateFatorR } from "./fatorR.ts";
import {
  EMPTY_VALUES,
  EXAMPLE_VALUES,
  FIELD_ORDER,
  REGIME_OPTIONS,
  fieldOfPointer,
  simulatorSchema,
  toRequest,
  type SimulatorValues,
} from "./schema.ts";
import { UFS } from "./ufs.ts";
import styles from "./SimulatorForm.module.css";

const LABELS: Readonly<Record<keyof SimulatorValues, string>> = {
  cnae: "Atividade (CNAE)",
  uf: "UF",
  issRate: "Alíquota de ISS ou ICMS",
  revenue: "Receita bruta anual",
  payroll: "Folha de pagamento anual",
  b2b: "Clientes empresas (B2B)",
  purchases: "Compras que geram crédito",
  regimes: "Regimes",
};

type Props = {
  onSubmit: (request: SimulationRequest) => void;
  submitting?: boolean;
  /** Erros por campo devolvidos pela API (422), mostrados junto dos campos. */
  serverProblems?: readonly FieldProblem[];
  /** Valores iniciais (por exemplo, vindos de um link compartilhado). */
  initialValues?: Partial<SimulatorValues>;
};

export function SimulatorForm({ onSubmit, submitting = false, serverProblems = [], initialValues }: Props) {
  const form = useForm<SimulatorValues>({
    resolver: zodResolver(simulatorSchema),
    defaultValues: { ...EMPTY_VALUES, ...initialValues },
    reValidateMode: "onChange",
  });
  const { register, control, handleSubmit, formState, reset, setError } = form;
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [exampleAnnouncement, setExampleAnnouncement] = useState("");

  const { errors, submitCount } = formState;
  const items = useMemo<SummaryItem[]>(
    () =>
      FIELD_ORDER.filter((field) => errors[field]?.message).map((field) => ({
        field,
        message: String(errors[field]?.message),
        label: LABELS[field],
      })),
    [errors],
  );

  useEffect(() => {
    if (submitCount > 0 && items.length > 0) summaryRef.current?.focus();
  }, [submitCount, items.length]);

  useEffect(() => {
    for (const problem of serverProblems) {
      const field = fieldOfPointer(problem.pointer);
      if (field) setError(field, { message: problem.detail });
    }
  }, [serverProblems, setError]);

  const focusField = (field: string): void => {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  };

  const [cnae, revenue, payroll, b2b, regimes] = useWatch({ control, name: ["cnae", "revenue", "payroll", "b2b", "regimes"] });
  const activity = useActivity(CNAE_PATTERN.test(cnae.trim()) ? cnae.trim() : null);
  const rateLabel = activity.data?.natureza === "COMERCIO" ? "Alíquota de ICMS" : activity.data ? "Alíquota de ISS" : "Alíquota de ISS ou ICMS";
  const fatorR = approximateFatorR(revenue, payroll);
  const b2bNumber = /^\d{1,3}$/.test(b2b) && Number(b2b) <= 100 ? Number(b2b) : null;

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit((values) => onSubmit(toRequest(values)))} className={styles["form"]}>
      <div className={styles["example"]}>
        <Button
          variant="secondary"
          onClick={() => {
            reset(EXAMPLE_VALUES);
            setExampleAnnouncement("Exemplo preenchido: serviços de tecnologia com receita de R$ 1,8 milhão.");
            focusField("cnae");
          }}
        >
          Preencher com um exemplo
        </Button>
        <p role="status" className="visually-hidden">{exampleAnnouncement}</p>
      </div>

      <ErrorSummary ref={summaryRef} items={items} onSelect={focusField} />

      <fieldset className={styles["section"]}>
        <legend>1. Sua empresa</legend>
        <Controller
          control={control}
          name="cnae"
          render={({ field }) => (
            <CnaeField
              name={field.name}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.cnae?.message}
            />
          )}
        />
        {activity.data ? <ActivityCard activity={activity.data} /> : null}
        <Select
          label="UF *"
          placeholder="Escolha o estado"
          options={UFS.map(([value, label]) => ({ value, label: `${value} — ${label}` }))}
          error={errors.uf?.message}
          {...register("uf")}
        />
        <TextField
          label={`${rateLabel} *`}
          hint="ISS para serviços e ICMS para comércio; o ISS fica entre 2% e 5%."
          inputMode="decimal"
          suffix="%"
          autoComplete="off"
          error={errors.issRate?.message}
          {...register("issRate")}
        />
      </fieldset>

      <fieldset className={styles["section"]}>
        <legend>2. Seus números (últimos 12 meses ou estimativa do ano)</legend>
        <Controller
          control={control}
          name="revenue"
          render={({ field }) => (
            <MoneyField
              label="Receita bruta anual *"
              hint="Soma de tudo que a empresa faturou no período."
              name={field.name}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.revenue?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="payroll"
          render={({ field }) => (
            <MoneyField
              label="Folha de pagamento anual *"
              hint="Inclui salários, pró-labore e encargos."
              name={field.name}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.payroll?.message}
            />
          )}
        />
        {fatorR !== null ? (
          <p role="status" aria-live="polite" className={styles["live"]}>
            Fator R aproximado: {fatorR}%. É a folha dividida pela receita; o cálculo oficial usa os últimos 12 meses.
          </p>
        ) : null}
      </fieldset>

      <fieldset className={styles["section"]}>
        <legend>3. Para quem você vende</legend>
        <Controller
          control={control}
          name="b2b"
          render={({ field }) => (
            <>
              <PercentField
                label="Clientes empresas (B2B) *"
                hint="Quanto da sua receita vem de outras empresas? Elas conseguem usar o crédito de CBS/IBS que você cobra."
                name={field.name}
                ref={field.ref}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.b2b?.message}
              />
              <label className={styles["slider"]}>
                <span className="visually-hidden">Ajuste fino da parcela B2B</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={b2bNumber ?? 0}
                  aria-valuetext={b2bNumber === null ? "não informado" : `${b2bNumber}% empresas e ${100 - b2bNumber}% pessoas físicas`}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </label>
              {b2bNumber !== null ? <p className={styles["live"]}>Pessoas físicas (B2C): {100 - b2bNumber}%</p> : null}
            </>
          )}
        />
        <Controller
          control={control}
          name="purchases"
          render={({ field }) => (
            <PercentField
              label="Compras que geram crédito (% da receita) *"
              hint="Insumos e serviços que você compra de empresas e que geram crédito de CBS/IBS."
              name={field.name}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.purchases?.message}
            />
          )}
        />
      </fieldset>

      <div className={styles["section-plain"]}>
        <Controller
          control={control}
          name="regimes"
          render={({ field }) => (
            <CheckboxGroup
              legend="4. O que comparar"
              name="regimes"
              hint="Simples híbrido: você segue no Simples, mas recolhe CBS e IBS fora do guia (DAS)."
              options={REGIME_OPTIONS}
              selected={regimes}
              onChange={field.onChange}
            />
          )}
        />
        {errors.regimes?.message ? <p className={styles["error"]}>⚠ {errors.regimes.message}</p> : null}
      </div>

      <Button type="submit" loading={submitting} className={styles["submit"]}>
        {submitting ? "Simulando…" : "Simular regimes"}
      </Button>
    </form>
  );
}
