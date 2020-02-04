import React from 'react'
import './App.css'
import SUPtitles from './dist'

function App() {
  const video = React.useRef(null)

  React.useEffect(() => {
    const sup = new SUPtitles(video.current, './exampleSubtitle.sup')
    return () => sup.dispose()
  }, [video])

  // Video by Google - "For Bigger Escape"
  return (
    <div className="App">
      <div
        style={{
          width: '80%',
          margin: 'auto',
          left: 'auto',
          right: 'auto',
          position: 'relative',
        }}
      >
        <video
          src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
          ref={video}
          style={{ width: '100%' }}
          controls
        ></video>
      </div>
    </div>
  )
}

export default App
