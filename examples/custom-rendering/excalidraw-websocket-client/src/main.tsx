import "@excalidraw/excalidraw/index.css"
import "./index.css"
import React from "react"
import { createRoot } from "react-dom/client"

import App from "./App.tsx"

const rootElement = createRoot(document.getElementById("root") as HTMLElement)

rootElement.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
