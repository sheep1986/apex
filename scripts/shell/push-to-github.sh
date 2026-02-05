#!/bin/bash

# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
# Replace REPO_NAME with your repository name

echo "Setting up GitHub remote..."
git remote remove origin
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/REPO_NAME.git

echo "Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "Done! Now connect this repo to Netlify for automatic deployments."