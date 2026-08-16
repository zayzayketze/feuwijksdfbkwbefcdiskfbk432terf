# VoidHaven SMP Website - Deployment Guide

## Quick Start

This is a static HTML/CSS/JavaScript website. No build process or server configuration needed!

## 📦 Deployment Options

### Option 1: GitHub Pages (Recommended - Free)

1. **Initialize Git Repository**
   ```bash
   cd /workspaces/feuwijksdfbkwbefcdiskfbk432terf
   git init
   git add .
   git commit -m "Initial commit: Professional VoidHaven SMP website"
   ```

2. **Create GitHub Repository**
   - Go to github.com and create a new repository named `voidhaven-smp`
   - Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/voidhaven-smp.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: main, Folder: /(root)
   - Save

4. **Custom Domain**
   - The CNAME file is already set to `voidhaven.cloud-ip.cc`
   - Configure your domain's DNS to point to GitHub Pages
   - Update your domain provider's DNS records

### Option 2: Netlify (Free - Recommended Alternative)

1. **Deploy from Git**
   - Push code to GitHub (see Option 1 steps 1-2)
   - Go to netlify.com and sign up
   - Click "New site from Git"
   - Select your GitHub repo
   - Deploy settings:
     - Build command: (leave empty - no build needed)
     - Publish directory: . (root)
   - Click "Deploy site"

2. **Configure Custom Domain**
   - In Netlify settings, add your custom domain
   - Follow DNS configuration instructions

### Option 3: Traditional Web Host (cPanel, etc.)

1. **Prepare Files**
   - All files in `/workspaces/feuwijksdfbkwbefcdiskfbk432terf/` are ready to upload

2. **Upload via FTP/SFTP**
   - Connect to your hosting server
   - Upload all files to public_html or www directory
   - Ensure `index.html` is in the root directory

3. **Configure Custom Domain**
   - Point your domain DNS to your hosting provider
   - Update A records and CNAME as needed

### Option 4: Docker (For Advanced Deployment)

Create a simple Dockerfile:

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

Build and run:
```bash
docker build -t voidhaven-smp .
docker run -p 80:80 voidhaven-smp
```

## 🔍 Pre-Deployment Checklist

- [ ] All links are correct (Discord, email)
- [ ] Server address is updated (`mc.voidhaven.net:25565`)
- [ ] Discord invite link works
- [ ] Email addresses are valid
- [ ] CNAME file has correct domain
- [ ] All images/assets load properly
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested
- [ ] Page load time acceptable

## 📋 Configuration Updates

### Update Server Information
Edit these sections in `index.html`:

```html
<!-- Server address -->
<h3>mc.voidhaven.net:25565</h3>

<!-- Server version -->
<span class="stat-value">1.26.2</span>

<!-- Member count -->
<strong>236</strong>
```

### Update Discord Link
Find and replace:
- `https://discord.gg/voidhavensmp` (appears in multiple places)

### Update Email
- `applications@voidhaven-smp.net` in the join CTA

### Update Colors (if desired)
Edit `styles.css` root variables:
```css
:root {
  --primary: #7c9cff;        /* Main blue */
  --primary-strong: #92b0ff;  /* Lighter blue */
  --accent: #7ef0d4;          /* Teal accent */
  --bg: #060b14;              /* Dark background */
}
```

## 🚀 Performance Optimization

### Already Optimized:
- ✅ Minimal CSS (no frameworks)
- ✅ Vanilla JavaScript (no libraries)
- ✅ Google Fonts with preconnect
- ✅ Responsive images ready
- ✅ CSS Grid/Flexbox layout
- ✅ Hardware-accelerated animations

### Optional Further Optimizations:

1. **Image Optimization** (if adding images)
   ```bash
   # Install imagemin
   npm install -g imagemin-cli imagemin-jpegtran imagemin-pngquant
   
   # Optimize images
   imagemin images/* --out-dir=images/compressed
   ```

2. **CSS Minification**
   ```bash
   npm install -g clean-css-cli
   cleancss -o styles.min.css styles.css
   ```

3. **JavaScript Minification**
   ```bash
   npm install -g uglify-js
   uglifyjs script.js -o script.min.js
   ```

4. **Enable Gzip Compression** (handled by most hosts)

## 📊 Monitoring & Analytics

### Add Google Analytics

Add this to the `<head>` section of `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Replace `GA_MEASUREMENT_ID` with your actual Google Analytics ID.

## 🔒 Security Best Practices

- ✅ No sensitive data in code
- ✅ HTTPS enforced (all hosts support this)
- ✅ No external CDN dependencies
- ✅ No database or backend (static site)
- ✅ Consider: robots.txt for SEO

### Add robots.txt

Create `robots.txt` in root:

```
User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://yourdomain.com/sitemap.xml
```

## 🧪 Testing Before Deployment

### Local Testing
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Visit http://localhost:8000
```

### Cross-Browser Testing
- Chrome/Chromium
- Firefox
- Safari
- Edge
- Mobile browsers

### Performance Testing
- Lighthouse: https://web.dev/measure/
- PageSpeed Insights: https://pagespeed.web.dev/
- GTmetrix: https://gtmetrix.com/

## 📝 Maintenance

### Regular Tasks
- Monitor uptime
- Check for broken links
- Update Discord invite if it expires
- Refresh player count if data becomes available
- Review FAQ based on common questions
- Update testimonials/quotes periodically

### Version Control
```bash
git add .
git commit -m "Update: [description]"
git push origin main
```

## 🆘 Troubleshooting

**Page doesn't load:**
- Check CNAME file points to correct domain
- Verify DNS records are configured
- Check all file paths are correct
- Ensure index.html is in root directory

**Styling looks broken:**
- Clear browser cache (Ctrl+Shift+Delete)
- Check styles.css is loading (F12 → Network tab)
- Verify CSS file path in HTML is correct

**JavaScript features don't work:**
- Check script.js is loading (F12 → Network tab)
- Check browser console for errors (F12 → Console)
- Verify JavaScript is enabled

**Discord link doesn't work:**
- Check invite URL is correct and hasn't expired
- Ensure target="_blank" is present
- Test link separately to verify

---

## 📞 Support

For issues or questions about deploying this website, refer to:
- README.md - Project documentation
- Host-specific documentation (GitHub Pages, Netlify, etc.)
- Web standards: MDN Web Docs (mdn.mozilla.org)
