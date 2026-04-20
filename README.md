This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### NixOS / Nix users

This repo ships a `flake.nix` that provides a dev shell with `bun`, `nodejs_22`, `vips`, and the native libraries `sharp` dlopens at runtime (`libstdc++`, `zlib`, `openssl`, `libuv`, `icu`). This fixes `ERR_DLOPEN_FAILED` errors caused by prebuilt npm binaries not finding FHS library paths on NixOS.

**One-time system setup** (in your NixOS config, for auto-loading):

```nix
programs.direnv.enable = true;
programs.direnv.nix-direnv.enable = true;
```

Then `sudo nixos-rebuild switch`.

**Per-repo setup:**

```bash
direnv allow        # trusts .envrc, auto-loads the dev shell on cd
bun install
bun run dev
```

Without direnv, use `nix develop` (interactive) or prefix commands with `nix develop -c`:

```bash
nix develop -c bun install
nix develop -c bun run build
```

### Other platforms

```bash
bun install
bun run dev
# or: npm / pnpm / yarn
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
