import { StartExperience } from "@/components/start-experience";

interface HomePageProps {
  searchParams: Promise<{
    registration?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return <StartExperience initialRegistration={params.registration ?? ""} />;
}
