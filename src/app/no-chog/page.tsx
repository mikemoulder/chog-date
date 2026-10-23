import Link from "next/link";
import { Wordmark } from "@/components/shell";

export default function NoChog() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center gap-6 px-4 py-12">
      <Wordmark />
      <h1 className="text-[32px] font-semibold leading-[38px] tracking-[-0.02em]">No Chog in this wallet.</h1>
      <p className="text-[16px] leading-[24px] text-muted">
        Chog Date is for holders only, because the Chog is the one dating. If yours is in another wallet, sign in with that one.
      </p>
      <div className="flex flex-wrap gap-2">
        <a className="btn btn-primary btn-lg" href="https://opensea.io/collection/chog-genesis" target="_blank" rel="noreferrer">
          Find a Chog on OpenSea
        </a>
        <Link className="btn btn-outline btn-lg" href="/">
          Try another wallet
        </Link>
      </div>
    </main>
  );
}
