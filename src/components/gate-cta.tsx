"use client";
import Link from "next/link";
import { useMe } from "@/lib/client";
import { SignInButton } from "./signin";

export function GateCta() {
  const { data } = useMe();
  if (data?.address && "chogs" in data && data.chogs.length) {
    return (
      <Link className="btn btn-accent btn-lg" href={data.activeTokenId ? "/swipe" : "/pick"}>
        Open Chog Date
      </Link>
    );
  }
  return <SignInButton />;
}
