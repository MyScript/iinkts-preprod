#!/bin/sh
# Prints the sha of the public mirror of <revision>: its whole history, every commit rewritten with
# the same author, committer, dates, message and merges, minus what stays internal (docker/,
# Jenkins*, examples/server-configuration.json, which held a key). The rewrite only depends on the
# source commits: a later revision gives a descendant of the earlier mirror, so the public branches
# move forward without -f.
# The source -> mirror pairs are cached in the git directory, under a name that changes with this
# script: without its cache, it rewrites the whole history again and gets the same commits.
#
# usage: mirror-commit.sh <revision>
set -eu

source=$(git rev-parse --verify "$1^{commit}")
if [ "$(git rev-parse --is-shallow-repository)" = true ]; then
  echo "mirror-commit.sh: shallow clone, the mirror would lose the history before its boundary" >&2
  exit 1
fi

map="$(git rev-parse --absolute-git-dir)/mirror-map-$(git hash-object "$0")"
touch "$map"

mirrored() {
  grep -m 1 "^$1 " "$map" | cut -d ' ' -f 2
}

# Prints <tree> without the internal entries, as a new tree
filter_tree() {
  examples=$(git ls-tree "$1" examples | cut -d ' ' -f 3 | cut -f 1)
  if [ -n "$examples" ]; then
    examples=$(git ls-tree "$examples" | awk -F '\t' '$2 != "server-configuration.json"' | git mktree)
  fi
  git ls-tree "$1" | awk -F '\t' -v examples="$examples" '
    $2 == "docker" || $2 ~ /^Jenkins/ { next }
    $2 == "examples" { split($1, entry, " "); print entry[1] " " entry[2] " " examples "\t" $2; next }
    { print }
  ' | git mktree
}

mirror() {
  commit=$1
  shift
  parents=""
  for parent in "$@"; do
    parents="$parents -p $(mirrored "$parent")"
  done
  {
    read -r author_name
    read -r author_email
    read -r author_date
    read -r committer_name
    read -r committer_email
    read -r committer_date
  } <<EOF
$(git log -1 --format='%an%n%ae%n%ad%n%cn%n%ce%n%cd' --date=raw "$commit")
EOF
  tree=$(filter_tree "$commit^{tree}")
  # The message as stored, from the first empty line of the raw commit on
  # shellcheck disable=SC2086 # $parents holds several words on purpose
  git cat-file commit "$commit" | sed '1,/^$/d' |
    GIT_AUTHOR_NAME=$author_name GIT_AUTHOR_EMAIL=$author_email GIT_AUTHOR_DATE=$author_date \
    GIT_COMMITTER_NAME=$committer_name GIT_COMMITTER_EMAIL=$committer_email GIT_COMMITTER_DATE=$committer_date \
    git commit-tree --no-gpg-sign "$tree" $parents
}

# Parents first; the commits already in the cache are skipped
git rev-list --reverse --topo-order --parents "$source" |
  awk 'FILENAME == ARGV[1] { done[$1] = 1; next } !($1 in done)' "$map" - |
  while read -r commit parents; do
    # shellcheck disable=SC2086 # one argument per parent
    echo "$commit $(mirror "$commit" $parents)" >> "$map"
  done

mirrored "$source"
