# Testing Supadocs

## Prerequisites
Ensure you have followed the setup instructions in [README.md](./README.md), including setting up `.env.local`.

## Manual Verification

### 1. Sidebar Navigation
- Run the app: `pnpm dev`.
- Open http://localhost:3000/docs.
- **Verify**: You should see a sidebar on the left.
- **Verify**: The sidebar lists "Documentation" and nested folders (e.g., "Nesting").
- **Verify**: Clicking a folder expands/collapses it.
- **Verify**: Clicking a link navigates to the document, highlighting it in the sidebar.

### 2. AI Chat & Search
- In the sidebar, click the **"Search or Ask AI..."** button.
- **Verify**: The "Supadocs" chat modal opens.
- **Verify**: You can type a message and receive a response (requires OpenAI key configured).

### 3. Sequential Navigation
- Navigate to a document (e.g., "What is Supadocs?").
- **Verify**: At the bottom of the page, you see a "Next" button (if a next page exists).
- Navigate to the next page.
- **Verify**: You see a "Previous" button.

## Automated Checks

### Type Checking
Run the TypeScript compiler to check for type errors:
```bash
pnpm --filter web typecheck
```

### Linting
Run ESLint to check for code quality issues:
```bash
pnpm --filter web lint
```
