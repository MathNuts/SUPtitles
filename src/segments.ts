interface IDictionary<TValue> {
  [id: string]: TValue
}

class BaseSegment {
  SEGMENT: IDictionary<string> = {
    '14': 'PDS',
    '15': 'ODS',
    '16': 'PCS',
    '17': 'WDS',
    '80': 'END',
  }
  pts: number
  dts: number
  type: string
  size: number
  data: Uint8Array

  constructor(bytes: Uint8Array) {
    if (80 !== bytes[0] && 71 !== bytes[1]) {
      throw new Error('InvalidSegmentError')
    }
    this.pts = a2h2i(bytes, 2, 6) / 90
    this.dts = a2h2i(bytes, 6, 10) / 90
    this.type = this.SEGMENT[intToHex(bytes[10])]
    this.size = a2h2i(bytes, 11, 13)
    this.data = bytes.slice(13)
  }
}

class PresentationCompositionSegment {
  STATE: IDictionary<string> = {
    '00': 'Normal',
    '40': 'Acquisition Point',
    '80': 'Epoch Start',
  }
  base: BaseSegment
  width: number
  height: number
  frameRate: number
  num: number
  state: string
  paletteUpdate: boolean
  paletteId: number
  numComps: number
  windowObjects: CompositionObject[]

  constructor(base: BaseSegment) {
    this.base = base
    this.width = a2h2i(base.data, 0, 2)
    this.height = a2h2i(base.data, 2, 4)
    this.frameRate = base.data[4]
    this.num = a2h2i(base.data, 5, 7)
    this.state = this.STATE[intToHex(base.data[7])]
    this.paletteUpdate = Boolean(base.data[8])
    this.paletteId = base.data[9]
    this.numComps = base.data[10]
    this.windowObjects = []

    let b = this.base.data.slice(11)
    while (b.length) {
      const len = 8 * (1 + b[3] ? 1 : 0)
      this.windowObjects.push(new CompositionObject(b.slice(0, len)))
      b = b.slice(len)
    }

    this.base.data = new Uint8Array(0)
  }

  getObjectById(id: number): CompositionObject | null {
    for (let i = 0; i < this.windowObjects.length; i++) {
      if (this.windowObjects[i].objectId === id) {
        return this.windowObjects[i]
      }
    }
    return null
  }

  getObjectByWindowId(id: number): CompositionObject | null {
    for (let i = 0; i < this.windowObjects.length; i++) {
      if (this.windowObjects[i].windowId === id) {
        return this.windowObjects[i]
      }
    }
    return null
  }
}

interface WindowSeg {
  windowId: number
  xOffset: number
  yOffset: number
  width: number
  height: number
}

class WindowDefinitionSegment {
  base: BaseSegment
  numWindows: number
  windows: WindowSeg[]

  constructor(base: BaseSegment) {
    this.base = base
    this.numWindows = base.data[0]
    this.windows = []

    for (let i = 0; i < this.numWindows; i++) {
      let o = 9 * i
      const wdw: WindowSeg = {
        windowId: base.data[o + 1],
        xOffset: a2h2i(base.data, o + 2, o + 4),
        yOffset: a2h2i(base.data, o + 4, o + 6),
        width: a2h2i(base.data, o + 6, o + 8),
        height: a2h2i(base.data, o + 8, o + 10),
      }
      this.windows.push(wdw)
    }

    this.base.data = new Uint8Array(0)
  }
}

class PaletteDefinitionSegment {
  base: BaseSegment
  paletteId: number
  version: number
  palette: Palette[]

  constructor(base: BaseSegment) {
    this.base = base
    this.paletteId = base.data[0]
    this.version = base.data[1]
    this.palette = []
    for (let i = 0; i < 256; i++) {
      this.palette.push(new Palette(0, 0, 0, 0))
    }
    const a = base.data.slice(2).length / 5
    for (var i = 0; i < a; i++) {
      const j = 2 + i * 5
      this.palette[base.data[j]] = new Palette(
        base.data[j + 1],
        base.data[j + 2],
        base.data[j + 3],
        base.data[j + 4]
      )
    }

    this.base.data = new Uint8Array(0)
  }
}

class ObjectDefinitionSegment {
  SEQUENCE: IDictionary<string> = {
    ' 40': 'Last',
    ' 80': 'First',
    ' c0': 'First and last',
  }
  base: BaseSegment
  id: number
  version: number
  type: string
  len: number
  width: number
  height: number
  imgData: Uint8Array

  constructor(base: BaseSegment) {
    this.base = base
    this.id = a2h2i(base.data, 0, 2)
    this.version = base.data[2]
    this.type = this.SEQUENCE[' ' + intToHex(base.data[3])]
    this.len = a2h2i(base.data, 4, 7)
    this.width = a2h2i(base.data, 7, 9)
    this.height = a2h2i(base.data, 9, 11)
    this.imgData = base.data.slice(11)

    if (this.type === 'Last') {
      this.imgData = base.data.slice(4)
    }

    this.base.data = new Uint8Array(0)
  }
}

class EndSegment {
  base: BaseSegment
  end: boolean
  constructor(base: BaseSegment) {
    this.base = base
    this.end = true

    this.base.data = new Uint8Array(0)
  }
}

class CompositionObject {
  objectId: number
  windowId: number
  cropped: boolean
  xOffset: number
  yOffset: number
  xOffsetCrop: number
  yOffsetCrop: number
  widthCrop: number
  heightCrop: number

  constructor(data: Uint8Array) {
    this.objectId = a2h2i(data, 0, 2)
    this.windowId = data[2]
    this.cropped = Boolean(data[3])
    this.xOffset = a2h2i(data, 4, 6)
    this.yOffset = a2h2i(data, 6, 8)
    this.xOffsetCrop = this.cropped ? a2h2i(data, 8, 10) : -1
    this.yOffsetCrop = this.cropped ? a2h2i(data, 10, 12) : -1
    this.widthCrop = this.cropped ? a2h2i(data, 12, 14) : -1
    this.heightCrop = this.cropped ? a2h2i(data, 14, 16) : -1
  }
}

class Palette {
  Y: number
  Cr: number
  Cb: number
  Alpha: number
  constructor(Y: number, Cr: number, Cb: number, Alpha: number) {
    this.Y = Y
    this.Cr = Cr
    this.Cb = Cb
    this.Alpha = Alpha
  }
}

function a2h2i(array: Uint8Array, from: number, to: number): number {
  // array to hex to int
  let hex = ''
  for (let i = from; i < to; i++) {
    hex += intToHex(array[i])
  }
  return parseInt(hex, 16)
}

function intToHex(x: number): string {
  return ('00' + x.toString(16)).slice(-2)
}

export {
  BaseSegment,
  PresentationCompositionSegment,
  WindowDefinitionSegment,
  PaletteDefinitionSegment,
  ObjectDefinitionSegment,
  EndSegment,
  a2h2i,
  intToHex,
  Palette,
  WindowSeg,
}
