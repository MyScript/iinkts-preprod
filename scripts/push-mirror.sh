#!/bin/sh
# Pushes <commit>, a mirror from mirror-commit.sh, to <branch> of <remote>, and <tag> with it when
# given, both or none. The branch only moves forward, except:
# - with -f, for the preprod branches of specific deployments, whose source branch may be rebased;
# - once, when its tip is still a snapshot of the former deployment (a commit of iink-ts-builder
#   whose subject starts with `iink-ts `), which the mirror then replaces with the full history.
# The forced push is leased on the tip it was checked against.
#
# usage: push-mirror.sh [-f] <remote> <commit> <branch> [<tag>]
set -eu

force=false
if [ "$1" = -f ]; then
  force=true
  shift
fi
remote=$1
commit=$2
branch=$3
tag=${4:-}

is_snapshot() {
  git log -1 --format='%ae %s' "$1" | grep -q '^iink-ts-builder@myscript\.com iink-ts '
}

lease=""
# Apart from the assignment: a failing ls-remote then stops the script
remote_ref=$(git ls-remote "$remote" "refs/heads/$branch")
tip=$(echo "$remote_ref" | cut -f 1)
if [ -n "$tip" ]; then
  git fetch -q "$remote" "refs/heads/$branch"
  if ! git merge-base --is-ancestor "$tip" "$commit"; then
    if [ "$force" = false ] && ! is_snapshot "$tip"; then
      echo "push-mirror.sh: $remote $branch ($tip) is not an ancestor of $commit, nothing pushed." >&2
      echo "Its source commit is missing from the history being pushed: was a release left out of master?" >&2
      exit 1
    fi
    lease="--force-with-lease=refs/heads/$branch:$tip"
  fi
fi

if [ -n "$tag" ]; then
  git push -q --atomic $lease "$remote" "$commit:refs/heads/$branch" "$commit:refs/tags/$tag"
else
  git push -q $lease "$remote" "$commit:refs/heads/$branch"
fi
