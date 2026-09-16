# The Useful Media Co website: setup instructions for Claude Code

This folder is a finished static website. No build step, no framework, no npm.
It is hosted free on GitHub Pages at https://theusefulmedia.com.
The owner, Raja, is not a developer. Do the work, and only stop to ask him when a step needs his login or a decision.

## Hard rules

- Never touch anything related to theusefultech.com (DNS, email, Medium, Beehiiv). Only theusefulmedia.com is in scope.
- Never use em dashes or en dashes in any copy.
- Keep the design as it is: colours #17172B, #7C5CFC, #FAFAF8; fonts Space Grotesk and JetBrains Mono (self-hosted in assets/fonts).
- Do not add analytics, trackers, cookies, or third-party scripts. The privacy policy depends on the site staying clean.
- All links to pages use root paths like /about/. Every page is a folder with index.html.

## Task 1: check the site has no placeholders

Run `grep -rn "REPLACE_" --include=*.html .` from this folder. It should return nothing. If anything shows up, stop and tell Raja.

## Task 2: sync the Wristkeeper privacy policy with the repo

The page wristkeeper/privacy/index.html already contains the policy as it stood on 16 September 2026. The source of truth is PRIVACY_POLICY.md in Raja's wristkeeper repository.

1. Find the local wristkeeper repository on this Mac (try `mdfind -name PRIVACY_POLICY.md`). If it is not on disk, clone it with `gh repo clone <username>/wristkeeper` into /tmp.
2. Compare PRIVACY_POLICY.md with the text between `<!-- PRIVACY_POLICY_START -->` and `<!-- PRIVACY_POLICY_END -->`.
3. If the wording differs, update the page to match the Markdown exactly. Keep the page structure: the intro paragraph uses `class="doc-intro"`, and each section is `<section class="policy-sec" id="slug"><h2>Title</h2>...</section>`. Update the "On this page" list so every section has a matching link.
4. Update the "Last updated" date after `<!-- PRIVACY_LAST_UPDATED -->` to match the Markdown.
5. Never rewrite or soften the policy wording. If the publisher name in the policy changed, tell Raja.

## Task 3: deploy to GitHub Pages

1. Check `gh --version`. If missing, install with Homebrew (`brew install gh`). If Homebrew is missing, tell Raja and stop.
2. Check `gh auth status`. If not logged in, run `gh auth login --web` and tell Raja exactly what to click in the browser.
3. Repository: `<username>/theusefulmedia`, public. If it already exists (Raja may have created it empty), use it. If not, create it with `gh repo create theusefulmedia --public`.
4. From this folder: `git init`, set branch `main`, commit everything (including CNAME and .nojekyll), add the remote, push.
5. Enable Pages from branch `main`, folder `/` (root):
   `gh api -X POST repos/<username>/theusefulmedia/pages -f "source[branch]=main" -f "source[path]=/"`
   If that returns an error because Pages already exists, use `-X PUT`.
6. Set the custom domain: `gh api -X PUT repos/<username>/theusefulmedia/pages -f cname=theusefulmedia.com`
7. Report back to Raja: the repository URL and the GitHub username. DNS is done by Raja in Hostinger afterwards, so the site will not load at theusefulmedia.com until then. That is expected.

## Task 4: after DNS works (only when Raja asks)

- `gh api repos/<username>/theusefulmedia/pages` should show `"status": "built"` and the cname.
- Turn on HTTPS: `gh api -X PUT repos/<username>/theusefulmedia/pages -F https_enforced=true` (works only after GitHub issues the certificate, which can take up to an hour after DNS resolves).
- Check with `curl -I https://theusefulmedia.com/wristkeeper/privacy/` that it returns 200.

## File map

- index.html: home
- products/index.html: product catalogue
- about/index.html: about Raja
- contact/index.html: contact options
- wristkeeper/index.html: Wristkeeper app page with support contact (usable as the App Store Support URL)
- wristkeeper/privacy/index.html: privacy policy (the App Store Privacy Policy URL)
- 404.html, CNAME, .nojekyll, robots.txt, sitemap.xml, favicon.svg
- assets/styles.css, assets/site.js, assets/og.png, assets/fonts/, assets/products/ (product covers)
