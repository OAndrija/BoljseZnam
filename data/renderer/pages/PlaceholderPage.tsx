import type { ReactNode } from 'react';

export default function PlaceholderPage({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <section>
      <h1>{title}</h1>
      <p>Ta zaslon še ni implementiran.</p>
      {children}
    </section>
  );
}
