# ❓ FAQ & Troubleshooting

## Frequently Asked Questions

### General Questions

**Q: Is my video uploaded to any server?**
A: No! All conversion happens locally in your browser. Your files never leave your computer.

**Q: Why does the first conversion take so long?**
A: The first time you convert, FFmpeg.wasm needs to download (~25MB). Subsequent conversions are much faster.

**Q: How large of a file can I convert?**
A: Technically unlimited, but large files (>500MB) may be slow or run into memory issues. Recommended: <200MB.

**Q: Can I convert multiple files at once?**
A: Not yet! This version converts one file at a time. Batch conversion could be added in the future.

**Q: Is this free?**
A: Yes! Completely free. No ads, no tracking, no limitations.

### Format Questions

**Q: What's the most compatible video format?**
A: MP4 with H.264 codec works on virtually all devices and platforms.

**Q: What's the most compatible audio format?**
A: MP3 is universally supported. AAC is also very compatible.

**Q: Which format gives the smallest file size?**
A: WebM for video, OGG for audio - but MP4 and MP3 have better compatibility.

**Q: Can I convert video to audio?**
A: Yes! Just select an audio format (like MP3) and the extension will extract the audio.

**Q: Why can't I convert to some formats?**
A: Some formats (like MIDI) require special handling. Most common formats are supported.

### Quality Questions

**Q: What quality should I choose?**
A: Medium is best for most uses. High for archiving, Low for quick sharing.

**Q: Does quality affect conversion time?**
A: Slightly. Low quality is fastest, High takes a bit longer.

**Q: Why is my output file larger than input?**
A: Some conversions increase file size (e.g., MP3 to WAV). Try a different format or lower quality.

**Q: Can I set custom bitrates?**
A: Not in the current version. The extension uses preset quality levels.

---

## 🐛 Troubleshooting

### Installation Issues

**Problem: Extension won't load**
```
Solutions:
1. Enable Developer Mode in chrome://extensions/
2. Check that all files are present
3. Look for errors in the Extensions page
4. Try removing and re-adding the extension
5. Make sure you're loading the correct folder
```

**Problem: No icon showing in toolbar**
```
Solutions:
1. Generate PNG icons using generate-icons.html
2. Save them to the icons folder
3. Verify file names (icon16.png, icon48.png, icon128.png)
4. Reload the extension
5. Click the Extensions puzzle icon and pin it
```

**Problem: Popup won't open**
```
Solutions:
1. Right-click extension icon → Inspect → Check console
2. Look for errors in popup.html or popup.js
3. Verify all JavaScript files are present
4. Check Content Security Policy in manifest
5. Try reloading the extension
```

### Conversion Issues

**Problem: "Failed to load FFmpeg"**
```
Solutions:
1. Check your internet connection (needed first time)
2. Check if CDN is blocked by firewall/proxy
3. Clear browser cache and try again
4. Check browser console for specific error
5. Try the popup-alternative.js version
```

**Problem: Conversion fails with error**
```
Solutions:
1. Check if file is corrupted (try opening it)
2. Try a smaller file first
3. Try a different output format
4. Close other tabs to free memory
5. Restart Chrome
6. Check console for specific error message
```

**Problem: Conversion stuck at 0% or 99%**
```
Solutions:
1. Wait - large files take time
2. Check if Chrome is frozen (Task Manager)
3. Close and reopen popup
4. Try smaller file
5. Lower quality setting
```

**Problem: "Out of memory" error**
```
Solutions:
1. Close other Chrome tabs
2. Close other applications
3. Try smaller file
4. Use Low quality setting
5. Restart Chrome
6. Increase system RAM if possible
```

### Download Issues

**Problem: Download button doesn't work**
```
Solutions:
1. Check browser download settings
2. Try different download location
3. Check if popup blocked downloads
4. Right-click and "Save link as"
5. Check browser console for errors
```

**Problem: Downloaded file won't play**
```
Solutions:
1. Check if conversion actually completed
2. Try different player (VLC is very compatible)
3. Try different output format
4. Check file size (should be > 0)
5. Try converting again
```

### Performance Issues

**Problem: Very slow conversion**
```
Solutions:
1. Close other Chrome tabs
2. Close other applications
3. Try Low quality setting
4. Use smaller files
5. Check system resources (Task Manager)
6. Disable other extensions temporarily
```

**Problem: Browser freezes or crashes**
```
Solutions:
1. File may be too large (try < 100MB)
2. Close other tabs first
3. Increase Chrome memory limit
4. Update Chrome to latest version
5. Check system RAM availability
```

### Format-Specific Issues

**Problem: Specific format won't convert**
```
Solutions:
1. Try MP4 or MP3 (most compatible)
2. Check FFmpeg.wasm format support
3. Input file may use unsupported codec
4. Try different input file
5. Check browser console for codec errors
```

**Problem: Video quality looks bad**
```
Solutions:
1. Try High quality setting
2. Input quality may be low already
3. Some formats compress more than others
4. Try different output format
5. MP4 usually gives good results
```

**Problem: Audio out of sync**
```
Solutions:
1. Input file may have sync issues
2. Try different output format
3. Some complex conversions may have issues
4. Try re-encoding with Medium quality
5. Report as bug if consistent
```

---

## 🔍 Debugging Steps

### Step 1: Check Console
1. Right-click extension icon
2. Click "Inspect"
3. Open Console tab
4. Look for error messages
5. Note any red text

### Step 2: Verify Files
1. Check all extension files exist
2. Verify icons are PNG format
3. Check manifest.json for typos
4. Ensure popup.html loads

### Step 3: Test with Small File
1. Use a tiny test file (< 5MB)
2. Try MP4 → MP4 conversion
3. Use Medium quality
4. If this works, issue is file-specific

### Step 4: Check Browser
1. Update Chrome to latest
2. Disable other extensions
3. Clear cache and cookies
4. Try in Incognito mode
5. Check for Chrome extension limits

### Step 5: System Resources
1. Open Task Manager
2. Check available RAM
3. Check CPU usage
4. Close memory-heavy apps
5. Restart computer if needed

---

## 🆘 Error Messages Explained

**"Unsupported file format"**
- The file extension is not in supported list
- Try renaming with correct extension
- File may be corrupted

**"Failed to initialize FFmpeg"**
- CDN connection issue
- Check internet connection
- Try again in a few minutes
- Check firewall/proxy settings

**"Conversion failed"**
- Generic error - check console
- File may be corrupted
- Format combination may not work
- Try different settings

**"Cannot read property of null"**
- JavaScript error
- Reload extension
- Check all files present
- May need to fix code

**"quota exceeded"**
- Browser storage limit reached
- Clear browser data
- Close and reopen extension
- File may be too large

---

## 💡 Pro Tips

### For Faster Conversions:
1. Use Low quality for testing
2. Close unnecessary tabs
3. Convert smaller files first
4. Keep FFmpeg loaded (don't close popup)
5. Use MP4/MP3 for fastest results

### For Best Quality:
1. Use High quality setting
2. Choose lossless formats (FLAC, WAV)
3. Match input format when possible
4. Don't convert multiple times
5. Start with good quality source

### For Smaller Files:
1. Use Low quality
2. Choose WebM for video
3. Choose OGG for audio
4. Lower resolution if needed
5. Remove audio from video if not needed

### For Compatibility:
1. Always use MP4 for video
2. Always use MP3 for audio
3. Use Medium quality
4. Test on target device
5. H.264 codec is most compatible

---

## 🚨 When to Report a Bug

Report if:
- ✅ Issue happens consistently
- ✅ You've tried troubleshooting steps
- ✅ Error message appears
- ✅ Specific format combination fails
- ✅ Extension crashes repeatedly

Don't report if:
- ❌ One-time glitch (try again first)
- ❌ Haven't tried basic troubleshooting
- ❌ System resource issue
- ❌ Using unsupported format
- ❌ File is corrupted

### What to Include in Bug Report:
1. Chrome version
2. Operating system
3. File format (input → output)
4. File size
5. Quality setting used
6. Error message (exact text)
7. Console errors (screenshot)
8. Steps to reproduce

---

## 📚 Additional Resources

### Documentation:
- README.md - Full documentation
- QUICKSTART.md - Installation guide
- TESTING.md - Testing procedures
- SUMMARY.md - Overview

### External Links:
- FFmpeg.wasm: https://ffmpegwasm.netlify.app/
- Chrome Extensions: https://developer.chrome.com/docs/extensions/
- FFmpeg Formats: https://ffmpeg.org/ffmpeg-formats.html

### Community:
- Chrome Web Store Developer Forums
- FFmpeg.wasm GitHub Issues
- Stack Overflow (chrome-extension tag)

---

## 🎯 Quick Reference

### Best Settings for Common Tasks:

**Share on Social Media:**
- Format: MP4 or WebM
- Quality: Low or Medium
- Why: Smaller file, faster upload

**Archive for Later:**
- Format: MKV or MP4
- Quality: High
- Why: Best quality preservation

**Play on Old Device:**
- Format: MP4
- Quality: Medium
- Why: Universal compatibility

**Extract Audio:**
- Format: MP3 or AAC
- Quality: Medium or High
- Why: Good quality, widely supported

**Reduce File Size:**
- Format: WebM
- Quality: Low
- Why: Best compression ratio

---

Still having issues? Check the browser console for detailed error messages!

**Remember**: First conversion always takes longer - be patient! ⏳
