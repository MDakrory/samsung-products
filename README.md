# Samsung Product Showcase

Static bilingual Samsung product catalogue for QR-driven in-store browsing. All public catalogue content is driven by `data/products.json`; adding, hiding, or removing a product does not require any HTML changes.

## Deploy to GitHub Pages (Free)

1. Create a GitHub account, then create a new public repository named `samsung-products`.
2. Upload all project files to the repository.
3. Go to Settings -> Pages.
4. Set Source to **GitHub Actions**.
5. Push to the `main` branch. The included workflow publishes only the public catalogue files.
6. The site will be live at `https://[username].github.io/samsung-products`.
7. Open `data/config.json` and replace `G-XXXXXXXXXX` with your GA4 Measurement ID.
8. Open `data/config.json` and replace the feedback form URL with your embedded Google Form URL.

## Run Locally

```powershell
python local-admin/serve.py
```

- Site: `http://localhost:8000`
- Admin: `http://localhost:8000/local-admin/manage.html`

`serve.py` disables browser caching so edits show up on refresh. Any static server works for the public site (`python -m http.server 8000`), but may serve stale files.

## Admin Panel (local only)

| Section | What it does |
| --- | --- |
| Dashboard | Totals, products per category, data-quality checks (broken images, missing titles/descriptions), quick feedback on/off |
| Products | Search, filter, sort; show/hide, feature, duplicate, edit, delete; select many rows for bulk show/hide/feature/move/delete |
| Bulk import / export | Export all products to Excel/CSV, edit, re-upload. Preview shows new / updated / unchanged / errors before applying. Options: add only, update only, or both; hide or delete products missing from the file; paste a list of models to show/hide/feature/delete |
| Categories | Rename, reorder, change icon or cover image, manage subcategories |
| Site settings | Show/hide the feedback page and product feedback button, feedback form URL, homepage text, search/featured/related sections, default language, GA ID |
| QR codes | Per-product QR codes with store ID; download ZIP or print |
| Save & publish | Save straight into the `data` folder (Chrome/Edge), publish changed files to GitHub, download files, backup/restore |

Unsaved changes are kept as a draft in the browser until you save, so a refresh does not lose work.

The Excel import accepts the admin's own template and the "Creation - New Content" sheet format (SKU, Product, Sub Category, Long Description/Title, Short Ar/EN, Description, Highlight 1..7). A highlight cell's first line is the title; the following lines are the body.

## Remove / Hide a Product

Hide is recommended: set `"active": false` in `data/products.json`. The product disappears from the homepage counts, category pages, related products, and QR browsing, while the data remains preserved.

Delete removes the product object entirely. Any QR code pointing to that SKU will show a friendly product unavailable message.

## Move to Custom Domain (Later)

1. Buy a domain.
2. In GitHub Pages Settings, enter the custom domain.
3. At your domain registrar, add a CNAME record pointing to `[username].github.io`.
4. Enable Enforce HTTPS.
5. No code changes are required because internal links are relative.

## Move to Any Other Host (Later)

Copy all files to any static web host such as Netlify, Vercel, cPanel, Apache, or Nginx. The site has no backend, build step, npm install, or framework dependency.

## QR Code Tracking

Use the QR codes section of the admin panel to generate QR URLs in this format:

```text
product.html?sku={SKU}&store={storeId}
```

When a customer scans a store QR, `product.html` sends a GA4 `store_qr_scan` event with:

- `store_id`
- `product_sku`
- `event_category: QR Traffic`

In Google Analytics, open Reports -> Engagement -> Events -> `store_qr_scan`, then group by the `store_id` parameter.

## Admin Publishing Security

The admin tool lives in the local-only `local-admin/` folder on your computer. It is ignored by git and must not be uploaded to any public host.

The GitHub repository name is saved in this browser's `localStorage`. The token is kept for the session only unless "Remember token on this device" is ticked. It is sent only to the GitHub Contents API when Publish to GitHub is clicked. Never put a token in `data/config.json` — that file is public.
