{ pkgs ? import <nixpkgs> {}
, system ? builtins.currentSystem
}:

let
  nodePackages = import ./default.nix {
    inherit pkgs system;
  };
in
nodePackages // {
  package = nodePackages.package.override {
    postInstall = ''
    ls node_modules
    npm run tsc
    '';
  };
}
