import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { Regime, SimulationResponse } from "../../api/types.ts";
import { chartData, regimesOf } from "./chartData.ts";
import { regimeStyle } from "./regimes.ts";
import styles from "./Result.module.css";

/** Traço de cada regime: o gráfico nunca depende só de cor (cor + marcador + traço + rótulo direto). */
const DASH: Readonly<Record<Regime, string | undefined>> = {
  SIMPLES: undefined,
  SIMPLES_HIBRIDO: "8 4",
  LUCRO_PRESUMIDO: "2 4",
};

function Marker({ regime, cx, cy }: { regime: Regime; cx?: number; cy?: number }) {
  if (cx === undefined || cy === undefined) return null;
  const color = regimeStyle(regime).colorVar;
  if (regime === "SIMPLES") return <rect x={cx - 4} y={cy - 4} width={8} height={8} fill={color} />;
  if (regime === "SIMPLES_HIBRIDO") return <polygon points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`} fill={color} />;
  return <circle cx={cx} cy={cy} r={4} fill={color} />;
}

type Props = { simulation: SimulationResponse };

/** Gráfico de linhas da carga por ano. A tabela comparativa logo abaixo traz os mesmos valores (equivalente textual). */
export default function CostChart({ simulation }: Props) {
  const data = chartData(simulation);
  const regimes = regimesOf(simulation);
  const last = data.length - 1;
  const summary = `Gráfico de linhas: carga tributária por ano, de ${data[0]?.ano} a ${data[last]?.ano}, para ${regimes
    .map((regime) => regimeStyle(regime).label)
    .join(", ")}. Os mesmos valores estão na tabela comparativa abaixo.`;

  return (
    <figure className={styles["chart"]}>
      <div role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height={300} initialDimension={{ width: 640, height: 300 }}>
          <LineChart data={data} margin={{ top: 16, right: 130, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="ano" stroke="var(--color-text-muted)" />
            <YAxis
              stroke="var(--color-text-muted)"
              width={64}
              tickFormatter={(value: number) => `${Math.round(value / 1000).toLocaleString("pt-BR")} mil`}
            />
            {regimes.map((regime) => {
              const style = regimeStyle(regime);
              return (
                <Line
                  key={regime}
                  type="monotone"
                  dataKey={regime}
                  name={style.label}
                  stroke={style.colorVar}
                  strokeWidth={2}
                  {...(DASH[regime] ? { strokeDasharray: DASH[regime] } : {})}
                  dot={<Marker regime={regime} />}
                  activeDot={false}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey={regime}
                    position="right"
                    content={(props) => {
                      const { x, y, index } = props as { x?: number; y?: number; index?: number };
                      if (index !== last || x === undefined || y === undefined) return null;
                      return (
                        <text x={x + 10} y={y + 4} fill={style.colorVar} fontSize={12} fontWeight={600}>
                          {style.label}
                        </text>
                      );
                    }}
                  />
                </Line>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption>
        <ul className={styles["legend"]} aria-label="Legenda do gráfico">
          {regimes.map((regime) => {
            const style = regimeStyle(regime);
            return (
              <li key={regime}>
                <svg width="36" height="12" aria-hidden="true">
                  <line x1="0" y1="6" x2="36" y2="6" stroke={style.colorVar} strokeWidth="2" {...(DASH[regime] ? { strokeDasharray: DASH[regime] } : {})} />
                </svg>{" "}
                <span aria-hidden="true">{style.marker} </span>
                {style.label}
              </li>
            );
          })}
        </ul>
      </figcaption>
    </figure>
  );
}
