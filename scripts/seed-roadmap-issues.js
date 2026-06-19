const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const issuesPath = path.join(root, ".github", "roadmap-issues.json");

async function main() {
  if (!token || !repository) {
    console.log("Skipping issue seed: GITHUB_TOKEN or GITHUB_REPOSITORY is missing.");
    return;
  }

  const [owner, repo] = repository.split("/");
  const issues = JSON.parse(fs.readFileSync(issuesPath, "utf8"));
  const existingIssues = await request(`/repos/${owner}/${repo}/issues?state=all&per_page=100`);
  const existingTitles = new Set(existingIssues.filter((issue) => !issue.pull_request).map((issue) => issue.title));
  const labels = new Set(issues.flatMap((issue) => issue.labels || []));

  for (const label of labels) await ensureLabel(owner, repo, label);

  for (const issue of issues) {
    if (existingTitles.has(issue.title)) {
      console.log(`Issue exists: ${issue.title}`);
      continue;
    }
    await request(`/repos/${owner}/${repo}/issues`, {
      method: "POST",
      body: {
        title: issue.title,
        body: `${issue.body}\n\n---\nSeeded from \`.github/roadmap-issues.json\`.`,
        labels: issue.labels || [],
      },
    });
    console.log(`Created issue: ${issue.title}`);
  }
}

async function ensureLabel(owner, repo, name) {
  const colors = {
    automation: "5319e7",
    build: "1d76db",
    cli: "0e8a16",
    compatibility: "fbca04",
    diff: "c2e0c6",
    enhancement: "a2eeef",
    fixture: "bfd4f2",
    "good first issue": "7057ff",
    media: "d4c5f9",
    offline: "006b75",
    repair: "d93f0b",
    security: "b60205",
    table: "fef2c0",
  };

  const color = colors[name] || "ededed";
  const description = `OpenHWP Studio roadmap: ${name}`;
  const response = await fetch(apiUrl(`/repos/${owner}/${repo}/labels/${encodeURIComponent(name)}`), headers({ method: "GET" }));
  if (response.status === 200) return;
  if (response.status !== 404) await throwResponse(response);

  await request(`/repos/${owner}/${repo}/labels`, {
    method: "POST",
    body: { name, color, description },
  });
  console.log(`Created label: ${name}`);
}

async function request(route, options = {}) {
  const response = await fetch(apiUrl(route), headers(options));
  if (!response.ok) await throwResponse(response);
  if (response.status === 204) return null;
  return response.json();
}

function headers(options) {
  return {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };
}

function apiUrl(route) {
  return `https://api.github.com${route}`;
}

async function throwResponse(response) {
  const text = await response.text();
  throw new Error(`GitHub API ${response.status}: ${text}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
