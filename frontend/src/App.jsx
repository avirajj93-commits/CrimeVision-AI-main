import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = 'https://crimevision-ai-1.onrender.com'

function App() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  /*
   * Create image preview whenever a new file is selected.
   * Revoke the previous object URL to avoid memory leaks.
   */
  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  /*
   * Handle evidence image selection.
   */
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    // Only allow image files
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      setFile(null)
      setResult(null)
      return
    }

    setFile(selectedFile)
    setResult(null)
    setError('')
  }

  /*
   * Upload image and request analysis.
   */
  const handleUpload = async () => {
    if (!file) {
      setError('Please select an evidence image first.')
      return
    }

    setUploading(true)
    setError('')
    setResult(null)

    try {
      // ==========================================
      // STEP 1: Upload evidence
      // ==========================================

      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch(
        `${API_BASE_URL}/api/evidence/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      let uploadData = {}

      try {
        uploadData = await uploadResponse.json()
      } catch {
        uploadData = {}
      }

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.message || 'Evidence upload failed.'
        )
      }

      if (!uploadData.filename) {
        throw new Error(
          'Upload completed, but the backend did not return a filename.'
        )
      }

      // ==========================================
      // STEP 2: Analyze uploaded evidence
      // ==========================================

      const analysisResponse = await fetch(
        `${API_BASE_URL}/api/analysis/${encodeURIComponent(
          uploadData.filename
        )}`
      )

      let analysisData = {}

      try {
        analysisData = await analysisResponse.json()
      } catch {
        analysisData = {}
      }

      if (!analysisResponse.ok) {
        throw new Error(
          analysisData.message || 'Evidence analysis failed.'
        )
      }

      // Backend may return { status: "error", message: "..." }
      if (analysisData.status === 'error') {
        throw new Error(
          analysisData.message || 'Evidence analysis failed.'
        )
      }

      setResult(analysisData)
    } catch (err) {
      console.error('CrimeVision-AI error:', err)

      setError(
        err.message ||
          'Could not connect to the CrimeVision-AI backend. Make sure Flask is running on port 5000.'
      )
    } finally {
      setUploading(false)
    }
  }

  /*
   * Extract analysis sections safely.
   */
  const analysis = result?.analysis
  const quality = analysis?.quality
  const exif = analysis?.exif

  return (
    <div className="app">

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="navbar">

        <div className="brand">

          <div className="brand-icon">
            CV
          </div>

          <div>
            <h2>CrimeVision-AI</h2>

            <span>
              Evidence Intelligence System
            </span>
          </div>

        </div>

        <div className="status">
          <span className="status-dot"></span>
          System Online
        </div>

      </nav>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main>

        {/* ===================================================
            HERO SECTION
        =================================================== */}

        <section className="hero-section">

          <div className="hero-content">

            <p className="eyebrow">
              AI-POWERED DIGITAL FORENSICS
            </p>

            <h1>
              Analyze Evidence.
              <br />
              <span>Reveal the Details.</span>
            </h1>

            <p className="hero-description">
              Upload crime-scene evidence and let CrimeVision-AI
              extract important visual information automatically.
            </p>


            {/* =================================================
                UPLOAD CARD
            ================================================= */}

            <div className="upload-card">

              <div className="upload-icon">
                ↑
              </div>

              <h3>
                Upload Evidence
              </h3>

              <p>
                Select an image from your computer for automated
                technical analysis.
              </p>


              <label className="file-input">

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                />

                <span>
                  {file
                    ? file.name
                    : 'Choose Evidence Image'}
                </span>

              </label>


              {/* Selected file */}

              {file && (

                <div className="selected-file">

                  <span>
                    Selected:
                  </span>

                  <strong>
                    {file.name}
                  </strong>

                </div>

              )}


              {/* Analyze button */}

              <button
                className="analyze-button"
                onClick={handleUpload}
                disabled={!file || uploading}
              >

                {uploading
                  ? 'Analyzing...'
                  : 'Analyze Evidence'}

              </button>


              {/* Error */}

              {error && (

                <p className="error-message">
                  {error}
                </p>

              )}

            </div>

          </div>


          {/* =================================================
              VISUAL SCANNER
          ================================================= */}

          <div className="hero-visual">

            <div className="scan-circle">

              <div className="scan-line"></div>

              <div className="target">

                <span></span>
                <span></span>
                <span></span>
                <span></span>

              </div>

              <div className="scan-text">

                <span>●</span>
                {' '}
                VISION ANALYSIS

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            ANALYSIS RESULTS
        ===================================================== */}

        {result && analysis && (

          <section className="results-section">

            {/* =================================================
                SECTION HEADER
            ================================================= */}

            <div className="section-heading">

              <p className="eyebrow">
                ANALYSIS COMPLETE
              </p>

              <h2>
                Evidence Report
              </h2>

              <p>
                Automated technical analysis of the uploaded
                evidence image.
              </p>

            </div>


            {/* =================================================
                EVIDENCE OVERVIEW
            ================================================= */}

            <div className="evidence-overview">


              {/* ================= IMAGE PREVIEW ================= */}

              <div className="evidence-preview">

                <div className="card-title">
                  Evidence Preview
                </div>

                <div className="preview-box">

                  {previewUrl ? (

                    <img
                      src={previewUrl}
                      alt="Uploaded evidence"
                    />

                  ) : (

                    <p>
                      Preview unavailable
                    </p>

                  )}

                </div>

              </div>


              {/* ================= FILE INFORMATION ================= */}

              <div className="file-information">

                <div className="card-title">
                  File Information
                </div>

                <div className="info-list">


                  <div className="info-row">

                    <span>
                      Filename
                    </span>

                    <strong>
                      {analysis.filename ||
                        file?.name ||
                        'N/A'}
                    </strong>

                  </div>


                  <div className="info-row">

                    <span>
                      Format
                    </span>

                    <strong>
                      {analysis.format || 'N/A'}
                    </strong>

                  </div>


                  <div className="info-row">

                    <span>
                      File Size
                    </span>

                    <strong>
                      {analysis.file_size_kb != null
                        ? `${analysis.file_size_kb} KB`
                        : 'N/A'}
                    </strong>

                  </div>


                  <div className="info-row">

                    <span>
                      Dimensions
                    </span>

                    <strong>
                      {analysis.width != null &&
                      analysis.height != null
                        ? `${analysis.width} × ${analysis.height}`
                        : 'N/A'}
                    </strong>

                  </div>


                  <div className="info-row">

                    <span>
                      Color Mode
                    </span>

                    <strong>
                      {analysis.color_mode || 'N/A'}
                    </strong>

                  </div>


                  <div className="info-row">

                    <span>
                      Aspect Ratio
                    </span>

                    <strong>
                      {analysis.aspect_ratio ?? 'N/A'}
                    </strong>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                IMAGE PROPERTIES
            ================================================= */}

            <div className="analysis-block">

              <div className="card-title">
                Image Properties
              </div>

              <div className="results-grid">


                <div className="result-card">

                  <span>
                    Width
                  </span>

                  <strong>
                    {analysis.width ?? 'N/A'} px
                  </strong>

                </div>


                <div className="result-card">

                  <span>
                    Height
                  </span>

                  <strong>
                    {analysis.height ?? 'N/A'} px
                  </strong>

                </div>


                <div className="result-card">

                  <span>
                    Aspect Ratio
                  </span>

                  <strong>
                    {analysis.aspect_ratio ?? 'N/A'}
                  </strong>

                </div>


                <div className="result-card">

                  <span>
                    Color Mode
                  </span>

                  <strong>
                    {analysis.color_mode || 'N/A'}
                  </strong>

                </div>

              </div>

            </div>


            {/* =================================================
                IMAGE QUALITY
            ================================================= */}

            {quality && (

              <div className="analysis-block">

                <div className="card-title">
                  Image Quality Analysis
                </div>

                <div className="results-grid">


                  <div className="result-card quality-card">

                    <span>
                      Brightness
                    </span>

                    <strong>
                      {quality.brightness ?? 'N/A'}
                    </strong>

                    <small>
                      Average image brightness
                    </small>

                  </div>


                  <div className="result-card quality-card">

                    <span>
                      Sharpness
                    </span>

                    <strong>
                      {quality.sharpness ?? 'N/A'}
                    </strong>

                    <small>
                      Image detail measurement
                    </small>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                EXIF METADATA
            ================================================= */}

            {exif && (

              <div className="analysis-block">

                <div className="card-title">
                  EXIF Metadata
                </div>

                <div className="metadata-grid">


                  <div className="metadata-item">

                    <span>
                      Camera Make
                    </span>

                    <strong>
                      {exif.camera_make ||
                        'Not available'}
                    </strong>

                  </div>


                  <div className="metadata-item">

                    <span>
                      Camera Model
                    </span>

                    <strong>
                      {exif.camera_model ||
                        'Not available'}
                    </strong>

                  </div>


                  <div className="metadata-item">

                    <span>
                      Date Taken
                    </span>

                    <strong>
                      {exif.date_taken ||
                        'Not available'}
                    </strong>

                  </div>


                  <div className="metadata-item">

                    <span>
                      Software
                    </span>

                    <strong>
                      {exif.software ||
                        'Not available'}
                    </strong>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                ANALYSIS STATUS
            ================================================= */}

            <div className="analysis-status">

              <div>

                <span className="status-dot"></span>

                <div>

                  <strong>
                    Analysis Successful
                  </strong>

                  <p>
                    Evidence image processed successfully.
                  </p>

                </div>

              </div>

              <span className="success-check">
                ✓
              </span>

            </div>

          </section>

        )}

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>

        <p>
          CrimeVision-AI
        </p>

        <span>
          AI-assisted digital evidence analysis
        </span>

      </footer>

    </div>
  )
}

export default App