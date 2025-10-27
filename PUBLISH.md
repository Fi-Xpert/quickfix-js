# Publishing Guide for quickfix-js

## Step-by-Step Instructions to Publish to npm

### 1. Create npm Account
If you don't have one yet:
- Visit https://www.npmjs.com/signup
- Create your free account

### 2. Update Package Information

Before publishing, update these fields in `package.json`:

```json
{
  "name": "quickfix-js",  // Or your chosen name
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "url": "https://github.com/yourusername/quickfix-js.git"
  }
}
```

**Package Name Options:**
- **Scoped (Recommended)**: `@yourname/quickfix` - Free, secure, no name conflicts
- **Unscoped**: `quickfix-js`, `node-quickfix`, `fixengine-js`

Check name availability: https://www.npmjs.com/package/your-package-name

### 3. Create GitHub Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: QuickFIX-JS library"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/quickfix-js.git
git branch -M main
git push -u origin main
```

### 4. Test Your Package Locally

```bash
# Test the library works
npm test

# See what will be published
npm pack --dry-run

# This shows all files that will be included
```

### 5. Login to npm

```bash
npm login
```

Enter your credentials:
- Username
- Password
- Email (this will be public)

### 6. Publish to npm

**For regular package:**
```bash
npm publish
```

**For scoped package (recommended):**
```bash
# If you used @yourname/quickfix
npm publish --access=public
```

### 7. Verify Publication

Visit your package page:
- https://www.npmjs.com/package/quickfix-js
- Or: https://www.npmjs.com/package/@yourname/quickfix

### 8. Update Versions (for future releases)

When you make changes:

```bash
# Bug fixes: 1.0.0 -> 1.0.1
npm version patch

# New features: 1.0.0 -> 1.1.0
npm version minor

# Breaking changes: 1.0.0 -> 2.0.0
npm version major

# Then publish
npm publish
```

## Pre-Publication Checklist

✅ Updated `author` in package.json  
✅ Set correct GitHub repository URL  
✅ Verified package name is available  
✅ Tested locally with `npm test`  
✅ Created MIT LICENSE file  
✅ README.md is comprehensive  
✅ Removed sensitive data (.env, credentials)  
✅ Created .npmignore to exclude unnecessary files  
✅ npm account created  
✅ Logged in with `npm login`  

## Post-Publication

1. **Add npm badge to README:**
   ```markdown
   [![npm version](https://badge.fury.io/js/quickfix-js.svg)](https://www.npmjs.com/package/quickfix-js)
   ```

2. **Tag your release on GitHub:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **Monitor usage:**
   - https://www.npmjs.com/package/quickfix-js/stats

## Useful Commands

```bash
# Check what's in your package
npm pack

# Unpublish (within 72 hours only!)
npm unpublish quickfix-js@1.0.0 --force

# Deprecate instead (better practice)
npm deprecate quickfix-js@1.0.0 "Please use version 1.0.1 instead"

# Update package description
npm version patch
npm publish
```

## Security Tips

- Never publish `.env` files or API keys
- Review `.npmignore` carefully
- Use `npm pack` to inspect the package before publishing
- Consider adding a security policy (SECURITY.md)

## Questions?

- npm documentation: https://docs.npmjs.com/
- Semantic Versioning: https://semver.org/
- GitHub Help: https://docs.github.com/

---

Ready to publish? Run:
```bash
npm login
npm publish --access=public
```

Good luck! 🚀
