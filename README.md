# Araz Sultanian Portfolio

Personal portfolio site for [araz-tech.com](https://araz-tech.com) (redirects to GitHub Pages).

## Live site

- **Production:** https://araz-cs.github.io (and https://araz-tech.com via redirect)
- **Deploy:** Push to `main` — GitHub Pages publishes automatically

## Revert a portfolio update

If a refresh needs to be undone:

1. **Before merge:** Close the PR on GitHub without merging.
2. **After merge:** Revert the merge commit on `main`, or restore `index.html` and `css/styles.css` from the previous commit:

```bash
git checkout main
git pull origin main
git log --oneline -5   # find the commit before the refresh
git revert <merge-commit-sha>   # or:
git checkout <old-commit> -- index.html css/styles.css
git commit -m "Revert portfolio refresh"
git push origin main
```

GitHub Pages will redeploy the reverted version within a few minutes.

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080
