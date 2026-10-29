# App Icon Generation

## Quick Start

### Option 1: Use the HTML Generator (Easiest)

1. Open `icon-generator.html` in your web browser
2. Click "Generate All Icons"
3. Download each icon by clicking the "Download" button
4. Save files with exact names shown:
   - `icon.png` (1024x1024)
   - `android-icon-foreground.png` (1024x1024)
   - `android-icon-background.png` (1024x1024)
   - `android-icon-monochrome.png` (1024x1024)
   - `splash-icon.png` (1284x2778)
5. Place all files in this `assets/` folder

### Option 2: Use Online Converter

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon-clean.svg`
3. Set dimensions:
   - For app icon: 1024x1024
   - For splash: 1284x2778
4. Download and rename files as needed

### Option 3: Use Python Script

```bash
pip install cairosvg
python generate_icons.py
```

## Files Created

- ✅ `icon-clean.svg` - Clean SVG template
- ✅ `icon-generator.html` - Browser-based generator (RECOMMENDED)
- ✅ `generate_icons.py` - Python script (requires cairosvg)

## Design

The icon features:
- **AI Neural Network** (top) - Represents AI intelligence
- **Briefcase** (bottom) - Represents career/professional work
- **Blue Color Scheme** (#3B82F6) - Brand color
- **Clean, Modern Design** - Scalable and recognizable

## Next Steps

After generating icons:
1. Place all PNG files in `assets/` folder
2. Run `npx expo start` to test
3. Icons will automatically be used by the app

The app.json is already configured to use these files!
