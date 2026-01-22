# ✅ Installation Checklist

## Pre-Installation (5 minutes)

### ☐ Step 1: Generate Icons
1. Open `generate-icons.html` in Chrome
2. Click "Download All Icons" button
3. Wait for 3 files to download:
   - icon16.png
   - icon48.png
   - icon128.png
4. Move these files to the `icons` folder
5. Verify all 3 PNG files are in `icons` folder

**Status:** ☐ Not Done | ☑ Complete

---

## Installation (2 minutes)

### ☐ Step 2: Open Chrome Extensions
1. Open Chrome browser
2. Type `chrome://extensions/` in address bar
3. Press Enter

**Status:** ☐ Not Done | ☑ Complete

### ☐ Step 3: Enable Developer Mode
1. Look for "Developer mode" toggle in top-right
2. Click to enable it
3. Verify it shows as ON (blue)

**Status:** ☐ Not Done | ☑ Complete

### ☐ Step 4: Load Extension
1. Click "Load unpacked" button
2. Navigate to `D:\Web\Extensions\CHROME\AnyVideoConverter`
3. Click "Select Folder"
4. Extension should appear in the list

**Status:** ☐ Not Done | ☑ Complete

### ☐ Step 5: Pin Extension (Optional)
1. Click Extensions icon (puzzle piece) in toolbar
2. Find "Any Video Converter"
3. Click pin icon to keep visible

**Status:** ☐ Not Done | ☑ Complete

---

## Verification (1 minute)

### ☐ Step 6: Test Extension
1. Click the extension icon
2. Popup should open showing upload area
3. Try clicking "Click to upload or drag & drop"
4. File picker should open

**Status:** ☐ Not Done | ☑ Complete

### ☐ Step 7: Quick Test Conversion
1. Find a small video file (< 10MB)
2. Upload it to the extension
3. Choose MP4 as output format
4. Choose Medium quality
5. Click Convert
6. Wait for FFmpeg to load (first time only)
7. Wait for conversion
8. Download converted file
9. Verify file plays correctly

**Status:** ☐ Not Done | ☑ Complete

---

## Troubleshooting Checklist

If something doesn't work, check:

### ☐ Icons Issues
- [ ] All 3 PNG files exist in icons folder
- [ ] Files named exactly: icon16.png, icon48.png, icon128.png
- [ ] Files are actual PNG images (not renamed)
- [ ] Reload extension after adding icons

### ☐ Extension Won't Load
- [ ] Developer mode is enabled
- [ ] Selected correct folder (AnyVideoConverter)
- [ ] All files present (see below)
- [ ] No errors shown in extension page
- [ ] Try removing and re-adding

### ☐ Required Files Present
- [ ] manifest.json
- [ ] popup.html
- [ ] popup.js
- [ ] styles.css
- [ ] ffmpeg.min.js
- [ ] icons/icon16.png
- [ ] icons/icon48.png
- [ ] icons/icon128.png

### ☐ Conversion Issues
- [ ] Internet connected (first time needs FFmpeg download)
- [ ] Firewall not blocking CDN
- [ ] File not corrupted
- [ ] File size reasonable (< 100MB for testing)
- [ ] Browser console shows no errors

---

## Success Criteria

You know it's working when:
- ✅ Extension icon visible in toolbar
- ✅ Popup opens when clicked
- ✅ File upload works (click or drag & drop)
- ✅ File info displays after upload
- ✅ Format selector shows options
- ✅ Convert button is enabled
- ✅ Progress bar appears during conversion
- ✅ Download button appears when done
- ✅ Downloaded file plays correctly

---

## Quick Reference

### File Structure Should Look Like:
```
AnyVideoConverter/
├── manifest.json
├── popup.html
├── popup.js
├── styles.css
├── ffmpeg.min.js
├── icons/
│   ├── icon16.png  ← Must have!
│   ├── icon48.png  ← Must have!
│   └── icon128.png ← Must have!
└── (other .md files)
```

### First Time Use:
1. Click extension icon
2. Upload small test file
3. Wait 30-60 seconds for FFmpeg to load
4. Choose output format
5. Click Convert
6. Wait for conversion
7. Download result

### Common First-Time Issues:
- **No icons?** → Generate them first!
- **Won't load?** → Enable Developer mode
- **Conversion fails?** → Check internet connection
- **Very slow?** → First time loads FFmpeg (~30s)

---

## Next Steps After Installation

### Immediate:
- [ ] Test with small file (< 10MB)
- [ ] Try different formats
- [ ] Test quality settings
- [ ] Verify download works

### Soon:
- [ ] Read README.md for full features
- [ ] Try different file types
- [ ] Test larger files
- [ ] Bookmark extension

### Later:
- [ ] Read TESTING.md for comprehensive tests
- [ ] Explore advanced features
- [ ] Share with colleagues/friends
- [ ] Provide feedback

---

## Time Estimates

| Task | Time |
|------|------|
| Generate icons | 2 min |
| Install extension | 3 min |
| First test | 2 min |
| **Total** | **~7 min** |

First conversion adds extra time:
- FFmpeg loading: ~30 seconds
- Small file conversion: ~15 seconds
- Total first conversion: ~45 seconds

---

## Help & Support

If stuck at any step:
1. Check FAQ.md for common issues
2. Look at TROUBLESHOOTING section in FAQ.md
3. Check browser console for errors
4. Try TESTING.md for detailed debugging
5. Review README.md for documentation

---

## Final Checklist

Before considering installation complete:
- ☐ Icons generated and in place
- ☐ Extension loaded in Chrome
- ☐ No errors in extensions page
- ☐ Icon visible in toolbar
- ☐ Popup opens correctly
- ☐ File upload works
- ☐ Conversion works
- ☐ Download works
- ☐ Converted file plays

**All checked?** 🎉 **You're ready to go!**

---

## Print This Page

☐ Print or keep open for reference during installation
☐ Check off each item as you complete it
☐ Use troubleshooting section if needed

**Good luck!** 🚀
