# Full Analysis Dashboard - Dark Theme Styling Guide

## Color Palette for Black Background

### Background Colors:
- Main content: `bg-black` with `border-gray-700`
- Cards: `bg-gray-900/50` with `border-gray-700`
- Nested cards: `bg-gray-800/50` with `border-gray-700`
- Hover states: `hover:border-gray-600`

### Text Colors:
- Headings (h2): `text-white`
- Subheadings (h3, h4): `text-gray-200`
- Body text: `text-gray-300`
- Secondary text: `text-gray-400`
- Tertiary/labels: `text-gray-500`

### Accent Colors (keep vibrant on dark):
- Purple: `text-purple-400`, `bg-purple-900/20`, `border-purple-500`
- Blue: `text-blue-400`, `bg-blue-900/20`, `border-blue-500`
- Green: `text-green-400`, `bg-green-900/20`, `border-green-500`
- Red: `text-red-400`, `bg-red-900/20`, `border-red-500`
- Yellow: `text-yellow-400`, `bg-yellow-900/20`, `border-yellow-500`

### Priority Badges:
- High: `bg-red-900/40 text-red-300`
- Medium: `bg-yellow-900/40 text-yellow-300`
- Low: `bg-green-900/40 text-green-300`

## Global Replacements Needed:

### Replace all instances:
1. `bg-white` → `bg-black border border-gray-700` (main containers)
2. `bg-gray-50` → `bg-gray-800/50 border border-gray-700`
3. `bg-gray-100` → `bg-gray-800`
4. `text-gray-900` → `text-white`
5. `text-gray-700` → `text-gray-300`
6. `text-gray-600` → `text-gray-400`
7. `border-gray-200` → `border-gray-700`

### Colored backgrounds (keep semi-transparent):
1. `bg-red-50` → `bg-red-900/20`
2. `bg-yellow-50` → `bg-yellow-900/20`
3. `bg-green-50` → `bg-green-900/20`
4. `bg-blue-50` → `bg-blue-900/20`
5. `bg-purple-50` → `bg-purple-900/20`
6. `bg-pink-50` → `bg-pink-900/20`

### Colored text (make brighter):
1. `text-red-600` → `text-red-400`
2. `text-yellow-600` → `text-yellow-400`
3. `text-green-600` → `text-green-400`
4. `text-blue-600` → `text-blue-400`
5. `text-purple-600` → `text-purple-400`
6. `text-indigo-600` → `text-indigo-400`

### Progress bars:
- Background: `bg-gray-700`
- Fill: Keep vibrant colors (purple-500, blue-500, etc.)

## Quick Find & Replace Commands:

```bash
# In FullAnalysisDashboard.tsx, replace:
text-gray-900 → text-white
text-gray-700 → text-gray-300
text-gray-600 → text-gray-400
bg-white → bg-gray-900/50 border border-gray-700
bg-gray-50 → bg-gray-800/50 border border-gray-700
bg-gray-100 → bg-gray-800
border-gray-200 → border-gray-700
bg-red-50 → bg-red-900/20
bg-yellow-50 → bg-yellow-900/20
bg-green-50 → bg-green-900/20
bg-blue-50 → bg-blue-900/20
bg-purple-50 → bg-purple-900/20
bg-pink-50 → bg-pink-900/20
text-red-600 → text-red-400
text-yellow-600 → text-yellow-400
text-green-600 → text-green-400
text-blue-600 → text-blue-400
text-purple-600 → text-purple-400
text-indigo-600 → text-indigo-400
bg-gray-200 → bg-gray-700
```

## Example Transformations:

### Before (Light Theme):
```tsx
<div className="border border-gray-200 rounded-lg p-6 bg-white">
  <h3 className="text-xl font-bold text-gray-900">Title</h3>
  <p className="text-sm text-gray-600">Description</p>
  <div className="bg-gray-50 p-4 rounded">
    <span className="text-gray-700">Content</span>
  </div>
</div>
```

### After (Dark Theme):
```tsx
<div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
  <h3 className="text-xl font-bold text-white">Title</h3>
  <p className="text-sm text-gray-400">Description</p>
  <div className="bg-gray-800/50 border border-gray-700 p-4 rounded">
    <span className="text-gray-300">Content</span>
  </div>
</div>
```

### Priority Badges Before:
```tsx
<span className="bg-red-100 text-red-700">High</span>
```

### Priority Badges After:
```tsx
<span className="bg-red-900/40 text-red-300">High</span>
```

## Testing Checklist:

- [ ] All text is readable on black background
- [ ] Borders are visible (gray-700)
- [ ] Cards have subtle backgrounds (gray-900/50)
- [ ] Nested cards are distinguishable (gray-800/50)
- [ ] Progress bars are visible
- [ ] Priority badges are readable
- [ ] Hover states work
- [ ] Accent colors pop against dark background
- [ ] No white flashes or jarring contrasts
