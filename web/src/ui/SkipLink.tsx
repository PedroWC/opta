type Props = { href: string; children: string };

/** Primeiro item focável da página: pula a navegação e vai ao conteúdo principal (WCAG 2.4.1). */
export function SkipLink({ href, children }: Props) {
  return <a className="skip-link" href={href}>{children}</a>;
}
