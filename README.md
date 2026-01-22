# Any Video Converter - Chrome Extension

A powerful Chrome extension that converts video and audio files to any format **locally in your browser** using FFmpeg.wasm. No server uploads, completely private and secure.

## 🎯 Features

- **Local Processing**: All conversions happen in your browser - no data leaves your computer
- **Auto Format Detection**: Automatically detects uploaded file format
- **Multiple Formats Supported**:
  - **Video**: MP4, MOV, AVI, MKV, WebM, FLV, WMV, MPEG, MPG, M4V, 3GP, TS
  - **Audio**: MP3, WAV, AAC, FLAC, ALAC, OGG, M4A, AMR, MIDI
- **Quality Control**: Choose between High, Medium, or Low quality
- **Progress Tracking**: Real-time conversion progress display
- **Drag & Drop**: Easy file upload via drag and drop
- **Fast & Efficient**: Uses WebAssembly for near-native performance

## 📦 Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download the Extension**
   - Download this entire folder to your computer

2. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or click Menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the `AnyVideoConverter` folder
   - Click "Select Folder"

5. **Pin the Extension** (Optional)
   - Click the Extensions icon (puzzle piece) in the Chrome toolbar
   - Find "Any Video Converter"
   - Click the pin icon to keep it visible

### Method 2: Create Icon Files (Required for proper display)

The extension uses SVG icons. To convert them to PNG for better compatibility:

1. Open `icons/icon128.svg` in a browser
2. Take a screenshot or use an SVG to PNG converter
3. Create three PNG versions:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)
4. Save them in the `icons` folder

Or use this online tool: https://cloudconvert.com/svg-to-png

## 🚀 Usage

1. **Click the Extension Icon**
   - Click the Any Video Converter icon in your Chrome toolbar

2. **Upload a File**
   - Click the upload area or drag & drop a video/audio file
   - Supported formats are automatically detected

3. **Choose Output Format**
   - Select your desired output format from the dropdown
   - Choose quality level (High/Medium/Low)

4. **Convert**
   - Click the "Convert" button
   - Wait for the conversion to complete (progress bar shows status)

5. **Download**
   - Once complete, click "Download File" to save the converted file
   - Click "Convert Another File" to start over

## ⚙️ Technical Details

### Technologies Used
- **FFmpeg.wasm**: WebAssembly port of FFmpeg for in-browser conversion
- **Chrome Extension Manifest V3**: Modern extension architecture
- **Vanilla JavaScript**: No frameworks required
- **CSS3**: Modern, gradient-based UI design

### File Processing
- All files are processed in browser memory
- No data is uploaded to any server
- Temporary files are cleaned up after conversion
- Memory-efficient streaming for large files

### Format-Specific Settings

**Video Formats**:
- MP4: H.264 video + AAC audio (most compatible)
- WebM: VP9 video + Opus audio (web-optimized)
- MKV: H.264 video + AAC audio (high quality container)
- AVI: H.264 video + MP3 audio (legacy support)

**Audio Formats**:
- MP3: Most compatible, good quality
- WAV: Uncompressed, highest quality
- AAC: Better quality than MP3 at same bitrate
- FLAC: Lossless compression
- OGG: Open format, good compression

### Quality Levels

| Quality | Video Bitrate | Audio Bitrate | CRF | Use Case |
|---------|---------------|---------------|-----|----------|
| High    | 5000k         | 320k          | 18  | Best quality, larger files |
| Medium  | 2500k         | 192k          | 23  | Balanced quality/size |
| Low     | 1000k         | 128k          | 28  | Smaller files, quick sharing |

## 🔧 Troubleshooting

### Extension Won't Load
- Make sure Developer Mode is enabled
- Check that all files are in the correct folder structure
- Refresh the extensions page

### Conversion Fails
- Check that the input file is not corrupted
- Try a different output format
- Some exotic formats may not be supported
- Ensure enough system memory is available

### Slow Performance
- Large files take longer to process
- Close other Chrome tabs to free up memory
- Try using a lower quality setting
- Some format combinations require more processing

### Icons Not Showing
- Create PNG versions of the SVG icons
- Make sure they're named correctly (icon16.png, icon48.png, icon128.png)
- Reload the extension after adding icons

## 📁 Project Structure

```
AnyVideoConverter/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI
├── popup.js              # Conversion logic
├── styles.css            # Styling
├── ffmpeg.min.js         # FFmpeg loader
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🔒 Privacy & Security

- **100% Local Processing**: No files are ever uploaded to any server
- **No Network Requests**: Except for loading FFmpeg.wasm library (one-time)
- **No Data Collection**: We don't collect any user data
- **Secure**: Runs in Chrome's sandboxed environment

## ⚠️ Limitations

- **File Size**: Very large files (>2GB) may cause performance issues
- **Processing Time**: Complex conversions can be CPU-intensive
- **Browser Memory**: Limited by available RAM
- **Format Support**: Dependent on FFmpeg.wasm capabilities
- **Mobile**: Not available for mobile Chrome browsers

## 🛠️ Development

### Modifying the Extension

1. Edit the source files in your text editor
2. Save changes
3. Go to `chrome://extensions/`
4. Click the refresh icon on the extension card
5. Test your changes

### Adding New Formats

To add support for a new format:

1. Add the format to `VIDEO_FORMATS` or `AUDIO_FORMATS` in `popup.js`
2. Add the format option in `popup.html` select dropdown
3. Add FFmpeg arguments in `buildFFmpegArgs()` function
4. Add MIME type in `getMimeType()` function

### Debugging

- Open Chrome DevTools on the popup: Right-click extension → Inspect
- Check console for errors and FFmpeg logs
- Enable logging in FFmpeg config: `log: true`

## 🤝 Contributing

Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project uses:
- FFmpeg.wasm (LGPL-2.1)
- Chrome Extension APIs (Google)

## 🙏 Credits

- **FFmpeg.wasm**: https://ffmpegwasm.netlify.app/
- **FFmpeg**: https://ffmpeg.org/

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Verify your Chrome version is up-to-date
3. Try reloading the extension
4. Check browser console for error messages

## 🎓 Learning Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [FFmpeg.wasm Documentation](https://github.com/ffmpegwasm/ffmpeg.wasm)
- [FFmpeg Formats Guide](https://ffmpeg.org/ffmpeg-formats.html)

---

**Made with ❤️ for the developer community**

*Convert any video, anywhere, anytime - all in your browser!*
