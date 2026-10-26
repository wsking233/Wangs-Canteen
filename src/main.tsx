import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

function App() {
  return (
    <main>
      <span className="mark" aria-hidden="true">王</span>
      <p className="eyebrow">WANG’S CANTEEN</p>
      <h1>欢迎来到小王食堂</h1>
      <p className="welcome">好好吃饭，慢慢生活。</p>
      <footer>小王食堂 · 从一顿好饭开始</footer>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
