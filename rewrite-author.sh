#!/bin/bash

CORRECT_NAME="maheshmani75"
CORRECT_EMAIL="manithanks754@gmail.com"

git filter-branch -f --env-filter "
    export GIT_COMMITTER_NAME='$CORRECT_NAME'
    export GIT_COMMITTER_EMAIL='$CORRECT_EMAIL'
    export GIT_AUTHOR_NAME='$CORRECT_NAME'
    export GIT_AUTHOR_EMAIL='$CORRECT_EMAIL'
" --tag-name-filter cat -- --branches --tags
