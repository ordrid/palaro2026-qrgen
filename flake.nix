{
  description = "palaro2026-qrgen dev shell";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            nodejs_22
            vips
            pkg-config
          ];

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath (with pkgs; [
            stdenv.cc.cc.lib
            zlib
            openssl
            libuv
            icu
            vips
          ]);

          SHARP_FORCE_GLOBAL_LIBVIPS = "1";
        };
      });
}
