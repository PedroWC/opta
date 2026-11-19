import { useState } from "react";
import { Link } from "react-router-dom";
import { useActivity } from "../../api/hooks.ts";
import { ActivityCard } from "../simulator/ActivityCard.tsx";
import { CNAE_PATTERN, CnaeField } from "../simulator/CnaeField.tsx";

/** Consulta de atividade (RF-05, UC-03) fora do simulador, com atalho para usá-la no formulário. */
export function ActivityLookup() {
  const [value, setValue] = useState("");
  const cnae = CNAE_PATTERN.test(value.trim()) ? value.trim() : null;
  const activity = useActivity(cnae);
  return (
    <div>
      <CnaeField value={value} onValueChange={setValue} />
      {cnae && activity.isError ? <p>Não encontramos esse CNAE. Tente o código completo, como 6201-5/01.</p> : null}
      {activity.data ? (
        <>
          <ActivityCard activity={activity.data} />
          <p>
            <Link to={{ pathname: "/", search: `?cnae=${activity.data.cnae}` }}>Usar esta atividade no simulador</Link>
          </p>
        </>
      ) : null}
    </div>
  );
}
