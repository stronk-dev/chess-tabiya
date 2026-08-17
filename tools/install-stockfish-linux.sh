#!/bin/sh
set -eu

STOCKFISH_VERSION="18"
STOCKFISH_COMMIT="cb3d4ee9b47d0c5aae855b12379378ea1439675c"
X86_ARCHIVE="stockfish-ubuntu-x86-64.tar"
X86_SHA256="5c6f38b02a4da5f3ffe763f27da6c3e743eebefd92b50cb3661623b96696adff"
SOURCE_SHA256="b5d3b85e08cdf9189a4753142eb21a4333983d97501531b19e1cd1ac9fc43f35"

destination=${1:?"usage: install-stockfish-linux.sh DESTINATION"}
if [ "$(uname -s)" != "Linux" ]; then
  echo "install-stockfish-linux.sh supports Linux only" >&2
  exit 1
fi
temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT HUP INT TERM

download() {
  curl --fail --location --retry 3 --show-error --silent "$1" --output "$2"
}

verify() {
  actual=$(sha256sum "$2" | awk '{print $1}')
  if [ "$actual" != "$1" ]; then
    echo "Stockfish archive checksum mismatch: expected $1, got $actual" >&2
    exit 1
  fi
}

machine=$(uname -m)
case "$machine" in
  x86_64|amd64)
    archive="$temporary/$X86_ARCHIVE"
    download "https://github.com/official-stockfish/Stockfish/releases/download/sf_18/$X86_ARCHIVE" "$archive"
    verify "$X86_SHA256" "$archive"
    tar -xf "$archive" -C "$temporary"
    source_directory="$temporary/stockfish"
    binary="$source_directory/stockfish-ubuntu-x86-64"
    ;;
  aarch64|arm64)
    archive="$temporary/stockfish-$STOCKFISH_COMMIT.tar.gz"
    download "https://github.com/official-stockfish/Stockfish/archive/$STOCKFISH_COMMIT.tar.gz" "$archive"
    verify "$SOURCE_SHA256" "$archive"
    source_directory="$temporary/source"
    mkdir -p "$source_directory"
    tar -xzf "$archive" -C "$source_directory" --strip-components=1
    jobs=$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 2)
    make -C "$source_directory/src" -j "$jobs" build ARCH=armv8
    binary="$source_directory/src/stockfish"
    ;;
  *)
    echo "Unsupported Stockfish build architecture: $machine" >&2
    exit 1
    ;;
esac

mkdir -p "$destination/bin" "$destination/source"
install -m 0755 "$binary" "$destination/bin/stockfish"
case "$machine" in
  aarch64|arm64) make -C "$source_directory/src" clean ;;
esac
cp "$source_directory/Copying.txt" "$source_directory/README.md" "$destination/source/"
cp -R "$source_directory/src" "$destination/source/src"

identity=$(printf 'uci\nquit\n' | "$destination/bin/stockfish")
if ! printf '%s\n' "$identity" | grep -F "id name Stockfish $STOCKFISH_VERSION" >/dev/null; then
  echo "Installed engine does not identify as Stockfish $STOCKFISH_VERSION" >&2
  exit 1
fi
