# Samsung Product Showcase

Static bilingual Samsung product catalogue for QR-driven in-store browsing. All public catalogue content is driven by `data/products.json`; adding, hiding, or removing a product does not require any HTML changes.

## Deploy to GitHub Pages (Free)

1. Create a GitHub account, then create a new public repository named `samsung-products`.
2. Upload all project files to the repository.
3. Go to Settings -> Pages.
4. Set Source to branch `main` and folder `/root`, then save.
5. The site will be live at `https://[username].github.io/samsung-products`.
6. Open `data/config.json` and replace `G-XXXXXXXXXX` with your GA4 Measurement ID.
7. Open `data/config.json` and replace the feedback form URL with your embedded Google Form URL.

## Add a New Product

### Option A: Admin Panel (recommended)

1. Open `https://[your-site]/admin/manage.html`.
2. Click the Add / Edit Product tab.
3. Fill in the form. Fields marked with `*` are required.
4. Click Save Product.
5. Go to the Save & Publish tab.
6. Click Publish to GitHub, or download `products.json` and upload it manually.
7. The product appears on the site within about 1 minute after GitHub Pages updates.

### Option B: Direct JSON edit

1. Open `data/products.json`.
2. Add a new object following the existing product schema.
3. Save and upload the file to GitHub.
4. Done. No other files need to change.

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

Use `admin/qr-generator.html` to generate QR URLs in this format:

```text
product.html?sku={SKU}&store={storeId}
```

When a customer scans a store QR, `product.html` sends a GA4 `store_qr_scan` event with:

- `store_id`
- `product_sku`
- `event_category: QR Traffic`

In Google Analytics, open Reports -> Engagement -> Events -> `store_qr_scan`, then group by the `store_id` parameter.

## Admin Publishing Security

The GitHub repository name and token entered in `admin/manage.html` are saved only in this browser's `localStorage` on this device. They are sent only to the GitHub Contents API when Publish to GitHub is clicked.

## Local Testing

Because browsers often block JSON loading from `file://`, test the full dynamic catalogue through any small static server from the project root. For example:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.
