# 🧪 Testing Guide

## Before You Start

Make sure you have:
1. ✅ Generated all icon files (icon16.png, icon48.png, icon128.png)
2. ✅ Loaded the extension in Chrome
3. ✅ Test video/audio files ready

## Quick Test Checklist

### ✅ Installation Test
- [ ] Extension loads without errors
- [ ] Icon appears in Chrome toolbar
- [ ] Clicking icon opens popup
- [ ] Popup UI displays correctly

### ✅ File Upload Test
- [ ] Click upload area opens file picker
- [ ] Drag & drop works
- [ ] File info displays correctly
- [ ] Format detected automatically

### ✅ Conversion Test
- [ ] Output format selector works
- [ ] Quality selector works
- [ ] Convert button is enabled
- [ ] Progress bar shows
- [ ] Conversion completes
- [ ] Download works

### ✅ Format Tests

**Video to Video:**
- [ ] MP4 → WebM
- [ ] AVI → MP4
- [ ] MOV → MP4

**Video to Audio:**
- [ ] MP4 → MP3
- [ ] Any video → MP3

**Audio to Audio:**
- [ ] MP3 → WAV
- [ ] WAV → MP3
- [ ] Any audio → AAC

### ✅ Quality Tests
- [ ] High quality (larger file)
- [ ] Medium quality (default)
- [ ] Low quality (smaller file)

### ✅ Error Handling
- [ ] Invalid file type shows error
- [ ] Large file handling
- [ ] Cancel during conversion
- [ ] Reset functionality

## Sample Test Files

### Where to Get Test Files:
1. **Sample Videos**: https://sample-videos.com/
2. **Sample Audio**: https://samplelib.com/sample-mp3.html
3. **Create your own**: Record a short video/audio

### Recommended Test Files:
- Small MP4 (< 10MB) - for quick tests
- Medium AVI (10-50MB) - for realistic tests
- Short MP3 (< 5MB) - for audio tests

## Common Issues & Solutions

### Issue: Extension Won't Load
**Solution:**
- Check manifest.json syntax
- Verify all files exist
- Check browser console for errors
- Try removing and re-adding extension

### Issue: Icons Not Showing
**Solution:**
- Generate PNG icons using generate-icons.html
- Verify icon files are in icons folder
- Check file names (icon16.png, icon48.png, icon128.png)
- Reload extension

### Issue: FFmpeg Won't Load
**Solution:**
- Check internet connection (first load needs CDN)
- Clear browser cache
- Check browser console for errors
- Verify Content Security Policy in manifest

### Issue: Conversion Fails
**Solution:**
- Check file isn't corrupted
- Try smaller file
- Try different output format
- Check available RAM
- Look at console errors

### Issue: Slow Performance
**Solution:**
- Close other Chrome tabs
- Try lower quality setting
- Use smaller test files
- Check system resources

### Issue: Download Doesn't Work
**Solution:**
- Check browser download settings
- Try different output location
- Verify blob creation
- Check console for errors

## Performance Benchmarks

Expected conversion times (on average hardware):

| File Size | Format      | Quality | Time    |
|-----------|-------------|---------|---------|
| 5MB       | MP4 → WebM  | Medium  | ~15s    |
| 10MB      | AVI → MP4   | Medium  | ~30s    |
| 25MB      | MOV → MP4   | High    | ~60s    |
| 3MB       | MP3 → WAV   | Medium  | ~5s     |
| 50MB      | MP4 → MP4   | Low     | ~45s    |

**Note:** First conversion takes longer (FFmpeg loading)

## Browser Console Debugging

### Enable Detailed Logging:
1. Right-click extension icon → Inspect
2. Open Console tab
3. Watch for:
   - FFmpeg loading messages
   - Progress updates
   - Error messages
   - File system operations

### Useful Console Commands:
```javascript
// Check if FFmpeg is loaded
console.log('FFmpeg loaded:', isFFmpegLoaded);

// Check current file
console.log('Current file:', currentFile);

// Check output blob
console.log('Output blob:', outputBlob);
```

## Testing Different Browsers

While this is a Chrome extension, you can test in:
- ✅ Chrome (Primary)
- ✅ Edge (Chromium-based)
- ✅ Brave (Chromium-based)
- ❌ Firefox (Different extension format)
- ❌ Safari (Different extension format)

## Automated Testing Ideas

If you want to add automated tests:

1. **Unit Tests:**
   - Format detection
   - File size formatting
   - MIME type detection
   - FFmpeg argument building

2. **Integration Tests:**
   - File upload flow
   - Conversion flow
   - Download flow
   - Error handling

3. **Performance Tests:**
   - Load time
   - Conversion speed
   - Memory usage
   - Large file handling

## User Testing Checklist

Get friends/colleagues to test:
- [ ] Can they install it easily?
- [ ] Is the UI intuitive?
- [ ] Do they understand the quality options?
- [ ] Does the progress indicator make sense?
- [ ] Are error messages helpful?
- [ ] Would they use this regularly?

## Before Publishing

Final checks before sharing:
- [ ] All tests pass
- [ ] No console errors
- [ ] Clean code (no debug logs)
- [ ] README is complete
- [ ] Screenshots/demo ready
- [ ] Version number set
- [ ] License file added

## Reporting Issues

When reporting issues, include:
1. Chrome version
2. Operating system
3. File size and format
4. Steps to reproduce
5. Console error messages
6. Screenshot if relevant

## Getting Help

If stuck:
1. Check console for errors
2. Review README.md
3. Check FFmpeg.wasm documentation
4. Search Chrome extension docs
5. Ask in developer forums

---

Happy Testing! 🎉

Report any bugs or suggestions to improve the extension.
