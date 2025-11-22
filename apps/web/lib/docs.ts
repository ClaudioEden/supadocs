import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type DocEntry = {
  slug: string[];
  title: string;
  description?: string;
  content: string;
  frontmatter: Record<string, string>;
};

export type DocTreeNode = {
  title: string;
  slug: string[];
  url: string;
  children?: DocTreeNode[];
};

const DOCS_DIR = resolveDocsDir();

export async function listDocSlugs(): Promise<string[][]> {
  const files = await collectFiles(DOCS_DIR);
  return files.map((file) => {
    const relative = path.relative(DOCS_DIR, file);
    const withoutExt = relative.replace(/\.(md|mdx)$/, "");
    return withoutExt.split(path.sep);
  });
}

export async function getDocBySlug(slug: string[]): Promise<DocEntry | null> {
  const filePath = path.join(DOCS_DIR, `${slug.join("/")}.mdx`);

  try {
    const raw = await readFile(filePath, "utf8");
    const frontmatterMatch = raw.match(/^---\n([\s\S]+?)\n---\n?/);
    let title = slug[slug.length - 1] ?? "Untitled";
    let description: string | undefined;
    let content = raw;
    let frontmatter: Record<string, string> = {};

    if (frontmatterMatch) {
      frontmatter = parseFrontmatter(frontmatterMatch[1]!);
      title = frontmatter.title ?? title;
      description = frontmatter.description;
      content = raw.slice(frontmatterMatch[0]!.length);
    }

    return { slug, title, description, content, frontmatter };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function getDocsTree(): Promise<DocTreeNode[]> {
  const slugs = await listDocSlugs();
  const docs = await Promise.all(
    slugs.map(async (slug) => {
      const doc = await getDocBySlug(slug);
      return doc ? { slug, title: doc.title } : null;
    })
  );

  const validDocs = docs.filter(
    (d): d is { slug: string[]; title: string } => d !== null
  );

  // Sort so we process shorter paths first usually, but logic below handles any order
  // However, sorting alphabetically by path helps structure
  validDocs.sort((a, b) => a.slug.join("/").localeCompare(b.slug.join("/")));

  const root: DocTreeNode[] = [];

  for (const doc of validDocs) {
    let currentLevel = root;
    const currentPathParts: string[] = [];

    for (let i = 0; i < doc.slug.length; i++) {
      const segment = doc.slug[i]!;
      currentPathParts.push(segment);
      const currentPath = currentPathParts.join("/");

      // Check if node exists at this level
      let node = currentLevel.find(
        (n) => n.slug[n.slug.length - 1] === segment
      );

      const isLeaf = i === doc.slug.length - 1;

      if (!node) {
        // Create node
        node = {
          title: isLeaf
            ? doc.title
            : segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          slug: currentPathParts.slice(),
          url: isLeaf
            ? doc.slug.length === 1 && doc.slug[0] === "index"
              ? "/docs"
              : `/docs/${currentPath}`
            : "#",
          children: [],
        };
        currentLevel.push(node);
      } else {
        // Node exists. If we are at the leaf now, update it with the actual doc title/url
        if (isLeaf) {
          node.title = doc.title;
          node.url =
            doc.slug.length === 1 && doc.slug[0] === "index"
              ? "/docs"
              : `/docs/${currentPath}`;
        }
      }

      if (!node.children) node.children = [];
      currentLevel = node.children;
    }
  }

  return root;
}

export async function getPrevNext(slug: string[]) {
  const tree = await getDocsTree();
  const flat: DocTreeNode[] = [];

  function flatten(nodes: DocTreeNode[]) {
    for (const node of nodes) {
      if (node.url !== "#") {
        flat.push(node);
      }
      if (node.children) {
        flatten(node.children);
      }
    }
  }
  flatten(tree);

  const currentUrl =
    slug.length === 1 && slug[0] === "index" ? "/docs" : `/docs/${slug.join("/")}`;

  const index = flat.findIndex((n) => n.url === currentUrl);

  if (index === -1) return { prev: null, next: null };

  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
  };
}

async function collectFiles(dir: string): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(res);
      }
      if (/\.(md|mdx)$/.test(entry.name)) {
        return [res];
      }
      return [];
    })
  );
  return files.flat();
}

function parseFrontmatter(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = source.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.+)\s*$/);
    if (!match) continue;
    const key = match[1];
    if (!key) continue;
    const rawValue = match[2] ?? "";
    result[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return result;
}

function resolveDocsDir(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "content/docs"),
    path.join(cwd, "apps/web/content/docs"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Docs directory not found. Checked: ${candidates.join(", ")}`
  );
}
