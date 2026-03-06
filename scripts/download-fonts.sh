#!/bin/bash
# Downloads Rijksoverheid fonts for PDF generation (server-side only)
# These fonts are NOT served on the website and NOT committed to git

DIR="$(dirname "$0")/../fonts"
mkdir -p "$DIR"

BASE="https://github.com/SLKTH/rijksoverheidfonts/raw/refs/heads/master"

for font in rijksoverheidsanstext-regular.ttf rijksoverheidsansheading-bold.ttf rijksoverheidserif-regular.ttf rijksoverheidserif-italic.ttf; do
  if [ ! -f "$DIR/$font" ]; then
    echo "Downloading $font..."
    curl -sL -o "$DIR/$font" "$BASE/$font"
  fi
done

echo "Rijksoverheid fonts ready in fonts/"
