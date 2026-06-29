import { PageLoader } from "@/components/ui/Loader";

// Instant loader for /admin routes while the server component resolves.
export default function Loading() {
  return <PageLoader className="min-h-[100dvh]" />;
}
