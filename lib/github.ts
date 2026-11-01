// Minimal GitHub REST/GraphQL calls for @Claude improvements. Plain fetch, no dependencies,
// so the sandbox runner can import it before `bun install` finishes.
import { REPO } from "../convex/lib/improve";

async function gh<T>(
  token: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok)
    throw new Error(`GitHub ${init.method ?? "GET"} ${path}: ${res.status} ${text.slice(0, 400)}`);
  return (text ? JSON.parse(text) : null) as T;
}

type PR = { number: number; html_url: string; state: string; merged: boolean; node_id: string };

export async function createPr(
  token: string,
  args: { branch: string; title: string; body: string },
) {
  return await gh<PR>(token, `/repos/${REPO}/pulls`, {
    method: "POST",
    body: { head: args.branch, base: "main", title: args.title, body: args.body },
  });
}

export async function updatePr(
  token: string,
  number: number,
  args: { title?: string; body?: string },
) {
  return await gh<PR>(token, `/repos/${REPO}/pulls/${number}`, {
    method: "PATCH",
    body: args,
  });
}

export async function getPr(token: string, number: number) {
  return await gh<PR>(token, `/repos/${REPO}/pulls/${number}`);
}

export async function comment(token: string, number: number, body: string) {
  await gh(token, `/repos/${REPO}/issues/${number}/comments`, {
    method: "POST",
    body: { body },
  });
}

// Squash-merges and deletes the branch.
export async function mergePr(token: string, number: number, branch: string) {
  await gh(token, `/repos/${REPO}/pulls/${number}/merge`, {
    method: "PUT",
    body: { merge_method: "squash" },
  });
  await gh(token, `/repos/${REPO}/git/refs/heads/${branch}`, {
    method: "DELETE",
  }).catch(() => {}); // already gone is fine
}

export async function closePr(token: string, number: number, branch: string) {
  await gh(token, `/repos/${REPO}/pulls/${number}`, {
    method: "PATCH",
    body: { state: "closed" },
  });
  await gh(token, `/repos/${REPO}/git/refs/heads/${branch}`, {
    method: "DELETE",
  }).catch(() => {});
}

// Opens a PR that reverts a merged PR (GitHub's "Revert" button). Returns its URL.
export async function revertPr(token: string, number: number) {
  const pr = await getPr(token, number);
  const res = await gh<{
    data?: { revertPullRequest?: { revertPullRequest?: { url: string } } };
    errors?: { message: string }[];
  }>(token, "/graphql", {
    method: "POST",
    body: {
      query: `mutation($id: ID!) { revertPullRequest(input: { pullRequestId: $id }) { revertPullRequest { url } } }`,
      variables: { id: pr.node_id },
    },
  });
  const url = res.data?.revertPullRequest?.revertPullRequest?.url;
  if (!url) throw new Error(res.errors?.[0]?.message ?? "Revert failed");
  return url;
}
