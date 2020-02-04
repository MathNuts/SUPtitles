function runLenDecode(bytes) {
    let pixels = [];
    let line = [];
    let incr = 0;
    let color = 0;
    let len = 0;
    let i = 0;
    while (i < bytes.length) {
        if (bytes[i]) {
            incr = 1;
            color = bytes[i];
            len = 1;
        }
        else {
            const check = bytes[i + 1];
            if (check === 0) {
                incr = 2;
                color = 0;
                len = 0;
                pixels.push(line);
                line = [];
            }
            else if (check < 64) {
                incr = 2;
                color = 0;
                len = check;
            }
            else if (check < 128) {
                incr = 3;
                color = 0;
                len = ((check - 64) << 8) + bytes[i + 2];
            }
            else if (check < 192) {
                incr = 3;
                color = bytes[i + 2];
                len = check - 128;
            }
            else {
                incr = 4;
                color = bytes[i + 3];
                len = ((check - 192) << 8) + bytes[i + 2];
            }
        }
        let temp = [];
        for (let j = 0; j < len; j++) {
            temp.push(color);
        }
        line = line.concat(temp);
        i += incr;
    }
    if (line.length !== 0) {
        pixels.push(line);
    }
    return pixels;
}
function ycbcr2rgb(rgb) {
    let transposed = [
        [1, 1, 1],
        [0, -0.34414, 1.772],
        [1.402, -0.71414, 0],
    ];
    for (let h = 0; h < rgb.length; h++) {
        rgb[h][1] = rgb[h][1] - 128;
        rgb[h][2] = rgb[h][2] - 128;
    }
    rgb = mmultiply(rgb, transposed);
    for (let i = 0; i < rgb.length; i++) {
        for (let j = 0; j < rgb[i].length; j++) {
            if (rgb[i][j] > 255) {
                rgb[i][j] = 255;
            }
            else if (rgb[i][j] < 0) {
                rgb[i][j] = 0;
            }
        }
    }
    return rgb;
}
function getPxAlpha(imgData, palette) {
    const px = runLenDecode(imgData);
    let a = [];
    for (let h = 0; h < palette.length; h++) {
        const entry = palette[h];
        a.push(entry.Alpha);
    }
    let alpha = [];
    for (let i = 0; i < px.length; i++) {
        let temp = [];
        for (let j = 0; j < px[i].length; j++) {
            temp.push(a[px[i][j]]);
        }
        alpha.push(temp);
    }
    return [px, alpha];
}
function getRgb(palette) {
    let ycbcr = [];
    for (let i = 0; i < palette.length; i++) {
        const entry = palette[i];
        ycbcr.push([entry.Y, entry.Cr, entry.Cb]);
    }
    const rgb = ycbcr2rgb(ycbcr);
    return rgb;
}
const mmultiply = (a, b) => a.map((x, i) => transpose(b).map(y => dotproduct(x, y)));
const dotproduct = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
const transpose = (a) => a[0].map((x, i) => a.map(y => y[i]));
export { getRgb, getPxAlpha };
