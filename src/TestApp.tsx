import React from 'react'

function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Test App Working!</h1>
      <p>If you can see this, React is working.</p>
      <button onClick={() => alert('Button clicked!')}>
        Click Me
      </button>
    </div>
  )
}

export default TestApp