# Canonical URL Auto-Generation

## Feature Overview

The `canonicalUrl` field in the category's SEO metadata is now **automatically generated** and updated. You don't need to manually set it!

## How It Works

### Automatic Generation
When you create or update a category, the system automatically builds the canonical URL using:

```
https://{store-domain}/category/{category-path}
```

### Examples

#### Root Category
```json
{
  "title": "Electronics",
  "slug": "electronics",
  "storeId": "..." // Store domain: awesome-electronics.com
}
```

**Auto-generated canonical URL**:
```
https://awesome-electronics.com/category/electronics
```

#### Child Category (Level 1)
```json
{
  "title": "Computers",
  "slug": "computers",
  "parentCategory": "ELECTRONICS_ID"
}
```

**Auto-generated canonical URL**:
```
https://awesome-electronics.com/category/electronics/computers
```

#### Nested Category (Level 2)
```json
{
  "title": "Laptops",
  "slug": "laptops",
  "parentCategory": "COMPUTERS_ID"
}
```

**Auto-generated canonical URL**:
```
https://awesome-electronics.com/category/electronics/computers/laptops
```

## When It Updates

The canonical URL is automatically regenerated when:

1. ✅ **Creating a new category** - Generated on first save
2. ✅ **Updating slug** - URL updates to reflect new slug
3. ✅ **Changing parent** - Path changes, URL updates
4. ✅ **Moving in hierarchy** - Any path change triggers update

## Implementation Details

### In the Model (`Category.ts`)

```typescript
// Pre-save middleware
CategorySchema.pre('save', async function (next) {
    // ... level and path calculation ...
    
    // Auto-generate canonical URL
    if (this.isModified('path') || this.isModified('slug') || this.isNew) {
        const Store = mongoose.model('Store');
        const store = await Store.findById(this.storeId);
        
        if (store) {
            const protocol = 'https://';
            const domain = store.domain;
            const categoryPath = this.path;
            
            this.seo.canonicalUrl = `${protocol}${domain}/category/${categoryPath}`;
        }
    }
    
    next();
});
```

### What You Send

**Before** (Manual):
```json
{
  "title": "Electronics",
  "slug": "electronics",
  "storeId": "...",
  "seo": {
    "canonicalUrl": "https://mystore.com/category/electronics",  // ❌ Manual
    "metaTitle": "Electronics"
  }
}
```

**Now** (Automatic):
```json
{
  "title": "Electronics",
  "slug": "electronics",
  "storeId": "...",
  "seo": {
    // canonicalUrl is auto-generated! ✅
    "metaTitle": "Electronics"
  }
}
```

## Benefits

### 1. **Consistency**
- All canonical URLs follow the same pattern
- No typos or formatting errors
- Always matches the actual category path

### 2. **Automatic Updates**
- Change slug? URL updates automatically
- Move category? URL reflects new path
- No manual intervention needed

### 3. **SEO Best Practices**
- Proper URL structure
- Matches actual site structure
- Search engines get accurate canonical URLs

### 4. **Developer Friendly**
- One less field to worry about
- Can't forget to set it
- Can't set it incorrectly

## Testing

### Create Category
```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Electronics",
    "slug": "electronics",
    "storeId": "693aa7e1f2f977c751e3d233"
  }'
```

**Response** (note the auto-generated canonical URL):
```json
{
  "message": "Category created successfully",
  "category": {
    "_id": "...",
    "title": "Electronics",
    "slug": "electronics",
    "path": "electronics",
    "level": 0,
    "seo": {
      "canonicalUrl": "https://awesome-electronics.com/category/electronics"
    }
  }
}
```

### Create Child Category
```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Laptops",
    "slug": "laptops",
    "storeId": "693aa7e1f2f977c751e3d233",
    "parentCategory": "ELECTRONICS_ID"
  }'
```

**Response**:
```json
{
  "category": {
    "title": "Laptops",
    "slug": "laptops",
    "path": "electronics/laptops",
    "level": 1,
    "seo": {
      "canonicalUrl": "https://awesome-electronics.com/category/electronics/laptops"
    }
  }
}
```

### Update Slug
```bash
curl -X PUT http://localhost:3001/api/categories/CATEGORY_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "laptop-computers"
  }'
```

**Result**: Canonical URL automatically updates to:
```
https://awesome-electronics.com/category/electronics/laptop-computers
```

## Frontend Usage

### Display Canonical URL in HTML
```html
<!-- The canonical URL is already set! -->
<link rel="canonical" href="{{ category.seo.canonicalUrl }}" />
```

### Example in React/Next.js
```tsx
import Head from 'next/head';

function CategoryPage({ category }) {
  return (
    <>
      <Head>
        <title>{category.seo.metaTitle || category.title}</title>
        <meta name="description" content={category.seo.metaDescription} />
        
        {/* Canonical URL is auto-generated */}
        <link rel="canonical" href={category.seo.canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:url" content={category.seo.canonicalUrl} />
      </Head>
      
      <h1>{category.title}</h1>
    </>
  );
}
```

## Edge Cases

### Store Domain Change
If you change a store's domain, you'll need to re-save all categories to update their canonical URLs:

```javascript
// Update all categories for a store
const categories = await Category.find({ storeId: 'STORE_ID' });
for (const category of categories) {
  await category.save(); // Triggers canonical URL regeneration
}
```

### Custom Canonical URL
If you need a custom canonical URL for a specific category, you can still set it manually in the database, but it will be overwritten on the next save.

## Summary

✅ **Automatic canonical URL generation**
- Based on store domain + category path
- Updates on create and update
- No manual intervention needed
- Always consistent and correct

✅ **What you need to provide**:
- `title` - Category name
- `slug` - URL-friendly identifier
- `storeId` - Which store
- `parentCategory` - Optional parent

✅ **What's automatic**:
- `level` - Hierarchy depth
- `path` - Full category path
- `seo.canonicalUrl` - Complete canonical URL

**You can now focus on content, and let the system handle the technical SEO details!** 🎉

---

**Updated**: 2025-12-11
**Feature**: Auto-generate canonical URLs for categories
