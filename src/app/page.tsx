import { HomeIntroContent } from "@/components/home/HomeIntroContent";
import { readAccessRole } from "@/lib/auth/session";
import { loadUniversityLogosManifest } from "@/lib/load-university-logos-manifest";

export const metadata = {
  title: "K-UniTrust Dashboard",
  description:
    "사립 대학·전문대학의 현황과 재정 경쟁력을 K-UniTrust에서 조회하고 분석하세요.",
};

export default async function HomePage() {
  const [logoMarqueeManifest, accessRole] = await Promise.all([
    loadUniversityLogosManifest(),
    readAccessRole(),
  ]);

  return (
    <HomeIntroContent
      passwordGate
      accessRole={accessRole}
      logoMarqueeManifest={logoMarqueeManifest}
    />
  );
}
