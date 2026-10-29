# App Icon & Splash Screen Assets

## App Icon Design (1024x1024)

### Design Concept
- **Theme:** AI-powered career coaching
- **Elements:** 
  - Briefcase icon (represents career/jobs)
  - AI brain or circuit pattern (represents AI intelligence)
  - Blue color scheme (#3B82F6 - primary brand color)
  - White background or transparent

### Design Specifications
- **Size:** 1024x1024 pixels
- **Format:** PNG with transparency
- **Safe Area:** 20% padding from edges (content within 820x820 center)
- **Style:** Modern, flat design with subtle gradients
- **Colors:**
  - Primary: #3B82F6 (Blue)
  - Secondary: #DBEAFE (Light Blue)
  - Accent: #1E40AF (Dark Blue)
  - Background: White or transparent

### Icon Composition
```
┌─────────────────────────┐
│                         │
│    [AI Brain Icon]      │  ← Top: Circuit/brain pattern
│         +               │
│    [Briefcase Icon]     │  ← Bottom: Professional briefcase
│                         │
│   Career Coach AI       │  ← Optional: Subtle text
└─────────────────────────┘
```

### How to Create

#### Option 1: Using Figma (Recommended)
1. Create 1024x1024 artboard
2. Add briefcase icon from Iconify or similar
3. Add AI/brain element above or integrated
4. Apply blue gradient (#3B82F6 to #1E40AF)
5. Export as PNG @1x, @2x, @3x

#### Option 2: Using Canva
1. Create custom size: 1024x1024
2. Search for "briefcase icon" and "AI icon"
3. Combine elements with blue color scheme
4. Download as PNG (transparent background)

#### Option 3: Using AI Image Generator
Prompt: "Modern app icon, blue briefcase with AI circuit pattern, flat design, professional, 1024x1024, white background, minimalist"

---

## Splash Screen Design

### Design Specifications
- **Size:** 1284x2778 pixels (iPhone 14 Pro Max)
- **Format:** PNG
- **Background:** White (#FFFFFF)
- **Content:** Centered app logo (40% of screen width)

### Composition
```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│                         │
│      [App Logo]         │  ← Centered vertically
│    Career Coach         │  ← App name below logo
│                         │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

### How to Create
1. Use same logo from app icon
2. Place on white background (1284x2778)
3. Center logo vertically and horizontally
4. Logo size: ~500px width
5. Add "Career Coach" text below (optional)
6. Export as PNG

---

## Android Adaptive Icon

### Foreground Image (1024x1024)
- Main icon content (briefcase + AI)
- Transparent background
- Content within safe area (660x660 center)

### Background Image (1024x1024)
- Solid color or gradient
- Color: #E6F4FE (light blue)
- No transparency

### Monochrome Image (1024x1024)
- Single color version of icon
- White icon on transparent background
- Used for themed icons on Android 13+

---

## Quick Setup with Placeholder

If you need to test immediately, use these placeholder commands:

### Create Simple Placeholder Icon
```bash
# Using ImageMagick (if installed)
convert -size 1024x1024 xc:#3B82F6 \
  -gravity center \
  -pointsize 200 \
  -fill white \
  -annotate +0+0 "CC" \
  assets/icon.png
```

### Create Simple Splash Screen
```bash
convert -size 1284x2778 xc:white \
  -gravity center \
  -pointsize 100 \
  -fill #3B82F6 \
  -annotate +0+0 "Career Coach" \
  assets/splash-icon.png
```

---

## File Locations

Place generated assets in these locations:

```
CareerCoach/
├── assets/
│   ├── icon.png                          (1024x1024 - Main app icon)
│   ├── splash-icon.png                   (1284x2778 - Splash screen)
│   ├── android-icon-foreground.png       (1024x1024 - Android foreground)
│   ├── android-icon-background.png       (1024x1024 - Android background)
│   └── android-icon-monochrome.png       (1024x1024 - Android monochrome)
```

---

## Testing Assets

### Test on iOS Simulator
```bash
npx expo start --ios
```

### Test on Android Emulator
```bash
npx expo start --android
```

### Build Preview
```bash
npx expo prebuild
```

---

## Asset Optimization

After creating assets, optimize them:

```bash
# Install optimization tools
npm install -g imagemin-cli imagemin-pngquant

# Optimize PNG files
imagemin assets/icon.png --out-dir=assets --plugin=pngquant
imagemin assets/splash-icon.png --out-dir=assets --plugin=pngquant
```

---

## Current app.json Configuration

The app.json is already configured to use these assets:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      }
    }
  }
}
```

Just create the assets and place them in the `assets/` folder!

---

## Design Resources

### Free Icon Resources
- **Iconify:** https://iconify.design/
- **Flaticon:** https://www.flaticon.com/
- **Icons8:** https://icons8.com/
- **Heroicons:** https://heroicons.com/

### Design Tools
- **Figma:** https://www.figma.com/ (Free)
- **Canva:** https://www.canva.com/ (Free)
- **Photopea:** https://www.photopea.com/ (Free, Photoshop alternative)

### AI Image Generators
- **DALL-E:** https://openai.com/dall-e-2
- **Midjourney:** https://www.midjourney.com/
- **Stable Diffusion:** https://stablediffusionweb.com/

---

## Next Steps

1. Create app icon (1024x1024)
2. Create splash screen (1284x2778)
3. Create Android adaptive icons (3 files)
4. Place all files in `assets/` folder
5. Test on simulator/emulator
6. Build and test on physical device

The app.json is already configured - just add the image files!
