export function CrmSection({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <section className="mt-10">
      <h1 className="font-display text-4xl text-cream">{title}</h1>
      <p className="mt-4 max-w-2xl text-cream/75">{copy}</p>
    </section>
  );
}
