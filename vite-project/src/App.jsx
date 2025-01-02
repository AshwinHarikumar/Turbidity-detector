import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [turbidity, setTurbidity] = useState(null)
  const [ambientLight, setAmbientLight] = useState(null)
  const [location, setLocation] = useState({ latitude: null, longitude: null })
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    // Access Ambient Light Sensor
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new AmbientLightSensor()
        sensor.addEventListener('reading', () => {
          setAmbientLight(sensor.illuminance)
        })
        sensor.start()
      } catch (error) {
        console.error("Ambient Light Sensor not supported:", error)
      }
    }

    // Access Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error("Error accessing geolocation:", error)
        }
      )
    }
  }, [])

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      })
      .catch(err => {
        console.error("Error accessing camera:", err)
      })
  }

  const captureImage = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const turbidityValue = calculateTurbidity(imageData)
    setTurbidity(turbidityValue)
  }

  const calculateTurbidity = (imageData) => {
    let total = 0
    for (let i = 0; i < imageData.data.length; i += 4) {
      const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
      total += brightness
    }
    const avgBrightness = total / (imageData.data.length / 4)
    // Incorporate ambient light into turbidity calculation
    return ambientLight ? avgBrightness * (ambientLight / 100) : avgBrightness
  }

  return (
    <>
      <div className="camera-section">
        <button onClick={startCamera}>Start Camera</button>
        <video ref={videoRef} width="300" height="225" />
        <button onClick={captureImage}>Capture Image</button>
        <canvas ref={canvasRef} width="300" height="225" style={{ display: 'none' }} />
        {turbidity && <p>Turbidity: {turbidity.toFixed(2)}</p>}
        {ambientLight && <p>Ambient Light: {ambientLight} lx</p>}
        {location.latitude && location.longitude && (
          <p>Location: {location.latitude.toFixed(2)},{location.longitude.toFixed(2)}</p>
        )}
      </div>
    </>
  )
}

export default App
