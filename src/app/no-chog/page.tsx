import Link from "next/link";
import { Wordmark } from "@/components/shell";

export default function NoChog() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center gap-6 px-[var(--gutter)] py-12">
      <Wordmark />
      <h1 className="t-display-l">No Chog, no date.</h1>
      <p className="t-lead">
        Chog Date is holders only. The Chog is the one dating, so this wallet needs a Chog Genesis NFT to get in. If yours is in another wallet, sign in with that one.
      </p>
      <div className="flex flex-wrap gap-3">
        <a className="btn btn-accent" href="https://opensea.io/collection/chog-genesis" target="_blank" rel="noreferrer">
          Find a Chog on OpenSea
        </a>
        <Link className="btn btn-quiet" href="/">
          Try another wallet
        </Link>
      </div>
    </main>
  );
}
