type Props = { items: ReadonlyArray<{ term: string; description: string }> };

/** Forma de lista de definição para tabelas e memória de cálculo em telas estreitas. */
export function DefinitionList({ items }: Props) {
  return (
    <dl>
      {items.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
