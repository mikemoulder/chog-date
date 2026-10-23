"use client";
import { useQuery } from "@tanstack/react-query";
import type { Me } from "./types";

// Browser → API seam. Errors carry the sentence the server wrote.
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? "Something went wrong");
  return data as T;
}

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api<Me | { address: null }>("/api/me"), staleTime: 30_000 });
}
