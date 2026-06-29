import { PageLoader } from "@/components/ui/Loader";

// Shown instantly on navigation into any /dashboard route while the server
// component resolves — removes the first-visit "stuck on old page" lag.
export default function Loading() {
  return <PageLoader className="min-h-[100dvh]" />;
}
