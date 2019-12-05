#!/bin/bash

# Builds API docs and demo, and then pushes them to gh-pages branch.

# exit on error
set -e

# remove the old gh-pages branch
if git show-ref --verify --quiet refs/heads/gh-pages
then
    git branch -D gh-pages
fi

# create ./docs
npm run docs

# make sure only ./docs is in the index
git reset
git add -f docs

# commit the ./docs folder to the current branch for now
git commit -m 'chore: add ./docs' --no-verify

# copy the content of ./docs to the gh-pages branch
git subtree split --prefix=docs -b gh-pages

# remove the temporary commit from the current branch
git reset HEAD^

# push the gh-pages branch
git push -f origin gh-pages
