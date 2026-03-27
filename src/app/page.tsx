import { StartExperience } from "@/components/start-experience";
import { isGameClosed } from "@/lib/site";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    registration?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return (
    <StartExperience
      initialRegistration={params.registration ?? ""}
      initialClosed={isGameClosed()}
    />
  );
}
