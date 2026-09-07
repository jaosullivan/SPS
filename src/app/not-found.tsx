import Link from "next/link";
import { Crest } from "@/components/crest";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <Crest size={160} className="h-36 w-36" />
      <h1 className="font-display mt-8 text-4xl text-cream">
        Nothing here, I&apos;m afraid
      </h1>
      <p className="mt-4 text-cream/70">
        That page has wandered off. Head home, or write to the Society if you
        were expecting to find something specific.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center rounded-full bg-saffron px-6 text-sm font-semibold text-ink hover:bg-gold"
      >
        Back to the homepage
      </Link>
    </div>
  );
}
