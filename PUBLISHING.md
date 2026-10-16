# Publishing guide — read this before publishing any new package

A from-scratch reference for publishing an npm package, based on how this
package (`@mrabukar/bg-remove-core`) was built and published. Keep this
updated if the process changes.

## 1. Anatomy of a publishable package

```
package-root/
├── src/              ← hand-written TypeScript source
├── dist/             ← compiled output (generated, gitignored, never hand-edited)
├── package.json      ← the manifest — npm's instruction sheet for this package
├── tsconfig.json     ← tells the TypeScript compiler how to build src/ → dist/
├── README.md         ← renders on the npm page and GitHub
├── LICENSE.md         ← the legal terms
├── .gitignore          ← tells git to ignore node_modules/, dist/, etc.
└── examples/            ← optional: a demo app proving the package works end-to-end
```

### `package.json` fields that matter for publishing

```jsonc
{
  "name": "@mrabukar/bg-remove-core",      // see scoping section below
  "version": "0.1.2",                       // bump every time you publish — npm blocks reusing a version
  "description": "...",                     // shows under the title on the npm page
  "license": "MIT",                         // shows on the npm page's sidebar
  "publishConfig": { "access": "public" },  // REQUIRED for scoped packages, or they publish as private (paid feature) by default
  "type": "module",                         // this package ships ES modules
  "main": "./dist/index.js",                // file Node/bundlers load on `import ... from "@mrabukar/bg-remove-core"`
  "types": "./dist/index.d.ts",             // file TypeScript reads for type information
  "files": [                                // ALLOWLIST of what actually gets published — everything else excluded
    "dist", "README.md", "LICENSE.md"
  ],
  "repository": {                           // powers the "Repository" link on the npm page
    "type": "git",
    "url": "git+https://github.com/mrabukar/bg-remove-core.git"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "prepublishOnly": "npm run build"       // npm runs this AUTOMATICALLY right before publish
  },
  "dependencies": { "@imgly/background-removal": "^1.4.5" }
}
```

**Why `files` matters**: without it, npm publishes almost everything in the
folder except what gitignore-style rules exclude. With it, you get an
explicit allowlist — cleaner, smaller, no accidental leaks. Always
sanity-check before publishing:

```bash
npm pack --dry-run
```

This shows exactly what would be uploaded, before you commit to it. Make
this a habit for every future package.

## 2. Scoping — personal vs. organization vs. unscoped

| Type | Example name | Setup needed | When to use |
|---|---|---|---|
| **Personal scope** | `@mrabukar/bg-remove-core` | None — tied to your existing npm account automatically | Default choice, zero setup |
| **Organization scope** | `@your-org/bg-remove-core` | Create a free npm Organization first: npmjs.com → your avatar → **Add Organization** → pick a name → invite yourself as a member | When the package represents a brand/team rather than you personally |
| **Unscoped** | `bg-remove-core` (no `@`) | None, but the name must be globally free across all of npm | Shortest to type, but most short names are already taken |

Scoped packages (`@anything/name`) are **private by default** unless you add
`"publishConfig": { "access": "public" }` to `package.json`, or pass
`--access public` on the publish command. Unscoped packages are public by
default. Forgetting this is the most common "why can't anyone find my
package" mistake.

You can't rename a published package in place — publish under the new name
as a fresh package and optionally deprecate the old one:
```bash
npm deprecate old-name "moved to new-name"
```

## 3. The full lifecycle — every time you change the package

1. **Edit** `src/*.ts`.
2. **Build & test locally**, before anything goes near npm:
   ```powershell
   npm run build
   npm run type-check
   ```
   If there's an `examples/` demo app, run `npm run dev` in it and actually
   exercise the feature in a browser. This is the step that catches "it
   compiles but doesn't actually work."
3. **Bump the version.** Semantic versioning (`MAJOR.MINOR.PATCH`):
   ```powershell
   npm version patch   # bug fix, no API change           0.1.2 → 0.1.3
   npm version minor   # new feature, backward-compatible  0.1.2 → 0.2.0
   npm version major   # breaking change                   0.1.2 → 1.0.0
   ```
   This edits `package.json`'s version, makes a git commit, and creates a
   git tag (e.g. `v0.1.3`) all at once.

   **Lesson learned**: always publish *immediately* after bumping. Running
   `npm version` twice without publishing in between just creates multiple
   unpublished bumps and confusion about what's actually live.
4. **Publish**:
   ```powershell
   npm publish --access public
   ```
   (`prepublishOnly` means `npm run build` fires automatically here too, so
   the published `dist/` is always fresh even if step 2 was skipped.)
5. **Push to git** so GitHub matches what's on npm:
   ```powershell
   git push
   git push --tags
   ```
   **Important**: publishing to npm and pushing to GitHub are two completely
   separate actions. Updating GitHub does **not** update the npm page, and
   vice versa — the npm page only reflects whatever was in the tarball at
   the moment of the last successful `npm publish`.
6. **Update anything that depends on it** (e.g. CutOut). In that project's
   `package.json`, bump the version range next to the dependency, then:
   ```powershell
   npm install
   ```

## 4. Checking things before/after

```powershell
npm whoami                                   # which npm account you're publishing as
npm pack --dry-run                           # preview exactly what will be uploaded
npm view <package-name>                      # see the currently live published version/metadata
npm view <package-name> versions             # list every version ever published
```

## 5. Things you can't undo (and the one thing you can)

- **A published version number can never be reused** — even unpublishing
  that exact version doesn't free it back up (npm blocks republishing a
  previously-unpublished version number).
- **Unpublishing** is only straightforward within **72 hours** of
  publishing: `npm unpublish <package>@<version>`. After that, npm support
  involvement is typically required.
- If something was published wrong, the fix is **not** unpublish — it's
  publish a corrected new version. Treat unpublish as emergency-only, not an
  "undo."
- You can mark an old version range as discouraged without removing it:
  ```bash
  npm deprecate <package>@"<0.1.2" "upgrade to 0.1.2+"
  ```
  Shows a warning to anyone installing that range without breaking anyone
  still pinned to it.

## 6. PowerShell-specific gotchas

- No `&&` — use `;` to run commands unconditionally, separate lines, or
  `cmd1; if ($?) { cmd2 }` to run the second only if the first succeeded.
- Everything else (`npm`, `git`) behaves the same as any shell.
