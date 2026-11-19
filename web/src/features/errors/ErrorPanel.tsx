import { Link } from "react-router-dom";
import { Button, Callout, Disclosure } from "../../ui/index.ts";
import { describeError, fieldLabel } from "./describeError.ts";

type Props = {
  error: unknown;
  onRetry?: () => void;
  /** Destino de "Ajustar dados" (formulário preenchido). */
  adjustTo?: { pathname: string; hash?: string };
};

/** Painel de erro único: texto em português, "Tentar de novo" quando faz sentido e detalhes técnicos sob demanda. */
export function ErrorPanel({ error, onRetry, adjustTo }: Props) {
  const description = describeError(error);
  return (
    <Callout tone="error" title={description.title}>
      <p>{description.message}</p>
      {description.fields.length > 0 ? (
        <ul>
          {description.fields.map((field) => (
            <li key={`${field.pointer}-${field.detail}`}>
              {fieldLabel(field.pointer)}: {field.detail}
            </li>
          ))}
        </ul>
      ) : null}
      <p>
        {description.retryable && onRetry ? <Button variant="secondary" onClick={onRetry}>Tentar de novo</Button> : null}{" "}
        {adjustTo ? <Link to={adjustTo}>Ajustar dados</Link> : null}
      </p>
      {description.technical ? (
        <Disclosure summary="Detalhes para o suporte">
          <p>{description.technical}</p>
        </Disclosure>
      ) : null}
    </Callout>
  );
}
