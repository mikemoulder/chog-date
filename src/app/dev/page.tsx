import { notFound } from "next/navigation";
import { DevLogin } from "./dev-login";

// Local testing page. 404s everywhere except `DEV_LOGIN=1 npm run dev`.
export default function DevPage() {
  if (process.env.NODE_ENV !== "development" || process.env.DEV_LOGIN !== "1") notFound();
  return <DevLogin />;
}
