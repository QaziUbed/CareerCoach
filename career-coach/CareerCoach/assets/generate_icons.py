"""
App Icon Generator for Career Coach
Converts SVG to PNG at required sizes
"""

try:
    from cairosvg import svg2png
    import os
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = script_dir
    
    # Input SVG file
    svg_file = os.path.join(assets_dir, 'icon-clean.svg')
    
    # Read SVG content
    with open(svg_file, 'r') as f:
        svg_content = f.read()
    
    # Generate main app icon (1024x1024)
    print("Generating icon.png (1024x1024)...")
    svg2png(bytestring=svg_content.encode('utf-8'),
            write_to=os.path.join(assets_dir, 'icon.png'),
            output_width=1024,
            output_height=1024)
    
    # Generate Android adaptive icons (1024x1024)
    print("Generating android-icon-foreground.png (1024x1024)...")
    svg2png(bytestring=svg_content.encode('utf-8'),
            write_to=os.path.join(assets_dir, 'android-icon-foreground.png'),
            output_width=1024,
            output_height=1024)
    
    # Generate background (solid color)
    print("Generating android-icon-background.png (1024x1024)...")
    bg_svg = '''<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="#E6F4FE"/>
    </svg>'''
    svg2png(bytestring=bg_svg.encode('utf-8'),
            write_to=os.path.join(assets_dir, 'android-icon-background.png'),
            output_width=1024,
            output_height=1024)
    
    # Generate monochrome version
    print("Generating android-icon-monochrome.png (1024x1024)...")
    mono_svg = svg_content.replace('#3B82F6', '#FFFFFF').replace('#1E40AF', '#FFFFFF').replace('#DBEAFE', 'transparent').replace('#93C5FD', 'transparent')
    svg2png(bytestring=mono_svg.encode('utf-8'),
            write_to=os.path.join(assets_dir, 'android-icon-monochrome.png'),
            output_width=1024,
            output_height=1024)
    
    # Generate splash screen (1284x2778)
    print("Generating splash-icon.png (1284x2778)...")
    splash_svg = f'''<svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
        <rect width="1284" height="2778" fill="#FFFFFF"/>
        <g transform="translate(642, 1389) scale(0.4)">
            {svg_content.split('<svg')[1].split('</svg>')[0]}
        </g>
    </svg>'''
    svg2png(bytestring=splash_svg.encode('utf-8'),
            write_to=os.path.join(assets_dir, 'splash-icon.png'),
            output_width=1284,
            output_height=2778)
    
    print("\n✅ All icons generated successfully!")
    print("\nGenerated files:")
    print("  - icon.png (1024x1024)")
    print("  - android-icon-foreground.png (1024x1024)")
    print("  - android-icon-background.png (1024x1024)")
    print("  - android-icon-monochrome.png (1024x1024)")
    print("  - splash-icon.png (1284x2778)")
    
except ImportError:
    print("❌ cairosvg not installed!")
    print("\nTo generate PNG icons, install cairosvg:")
    print("  pip install cairosvg")
    print("\nOr use an online converter:")
    print("  1. Go to https://cloudconvert.com/svg-to-png")
    print("  2. Upload icon-clean.svg")
    print("  3. Set width and height to 1024")
    print("  4. Download as icon.png")
    print("\nFor splash screen:")
    print("  1. Set width to 1284 and height to 2778")
    print("  2. Download as splash-icon.png")
