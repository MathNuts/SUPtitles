[![npm](https://img.shields.io/npm/v/suptitles)](https://www.npmjs.com/package/suptitles)

SUPtitles renders Blu-ray subtitles(.sup) in the browser using JS.
This project is still in development.

## Why?

Display subtitles in the browser without using OCR or other methods to pre-process the subtitles.
No changes to the original text and styling(OCR is not always reliable).

## How?

Thanks to this [article by TheScorpius666](http://blog.thescorpius.com/index.php/2017/07/15/presentation-graphic-stream-sup-files-bluray-subtitle-format/), I was able to parse the .sup files and display them by using a HTML canvas.

The subtitles(.sup) can be extracted from a video using [ffmpeg](https://www.ffmpeg.org/)
```console
ffmpeg -i video.mkv -map 0:s:0 -c copy subtitle.sup
```

## Usage

### Install

Download dist folder or run

```console
npm i suptitles
```

### Import

```javascript
import SUPtitles from 'suptitles' // Or './dir/to/index.js'

const videoElement = document.getElementById('video')
// Pass video element and subtitle url to constructor
const sup = new SUPtitles(videoElement, './exampleSubtitle.sup')
```

SUPtitles will make a canvas covering 100% of its parent. For the subtitles to overlay the video properly, add a container with the position property set to relative.

```HTML
<div style="position:relative;">
    <video
        controls
        style="width:100%;"
        id="video"
    ></video>
</div>
```

### Disposing

To dispose of SUPtitles call the dispose method.

```javascript
const sup = new SUPtitles(videoElement, './exampleSubtitle.sup')
sup.dispose()
```

## Known Issues

- After seeking the current subtitle will be skipped
- No feedback from constructor, invalid files will not output any error
- Probably more..

## Building

- Change tsconfig.json to fit your preferences
- Run tsc
