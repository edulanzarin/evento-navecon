#!/bin/sh
# Builds the site for GitHub Pages and force-pushes it to the gh-pages branch.
#
# GitHub Pages must be configured once in the repo settings:
#   Settings → Pages → Source: "Deploy from a branch" → Branch: gh-pages / (root)
#
# The site is then served at https://edulanzarin.github.io/evento-navecon/
set -eu

cd "$(dirname "$0")/.."

npm run test -- run
npx vite build --mode ghpages
touch dist/.nojekyll

# Build a commit containing only dist/ without touching the working tree.
export GIT_INDEX_FILE="$(mktemp)"
trap 'rm -f "$GIT_INDEX_FILE"' EXIT
git --work-tree=dist add -A
TREE=$(git write-tree)
COMMIT=$(git commit-tree -m "Deploy built site to GitHub Pages" "$TREE")
git branch -f gh-pages "$COMMIT"

git push -f origin gh-pages
echo "Publicado: https://edulanzarin.github.io/evento-navecon/"
