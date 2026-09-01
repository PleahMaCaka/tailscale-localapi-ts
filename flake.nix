{
  description = "tailnet monorepo";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  nixConfig = {
    bash-prompt = "dev";
    bash-prompt-suffix = " > ";
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };

        headscaleConfig = ./nix/headscale.yaml;

        tailnet = pkgs.writeShellApplication {
          name = "tailnet";
          runtimeInputs = with pkgs; [
            headscale
            tailscale
            curl
            jq
            coreutils
          ];
          text = builtins.replaceStrings [ "@headscaleConfig@" ] [ "${headscaleConfig}" ] (
            builtins.readFile ./nix/tailnet.sh
          );
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            biome
            headscale
            tailscale
            jq
            tailnet
          ];

          shellHook = ''
            export TAILSCALE_TS_DEV_DIR="''${XDG_STATE_HOME:-$HOME/.local/state}/tailscale.ts"
            export TAILSCALE_LOCALAPI_SOCKET="$TAILSCALE_TS_DEV_DIR/tailscaled.sock"
            export HEADSCALE_URL="http://127.0.0.1:8080"
            if [ -s "$TAILSCALE_TS_DEV_DIR/apikey" ]; then
              HEADSCALE_API_KEY="$(cat "$TAILSCALE_TS_DEV_DIR/apikey")"
              export HEADSCALE_API_KEY
            fi
            tailnet() {
              command tailnet "$@" || return
              case "''${1:-up}" in
                up) eval "$(command tailnet env)" ;;
                reset) unset HEADSCALE_API_KEY ;;
              esac
            }
            export -f tailnet
            echo "tailnet dev shell"
            echo "  tailnet up      start an isolated headscale + tailscaled on loopback"
            echo "  tailnet status  show the local tailnet state"
            echo "  tailnet down    stop both daemons"
            echo "  tailnet reset   stop and delete all local tailnet state"
          '';
        };
      }
    );
}
