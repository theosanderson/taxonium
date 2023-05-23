import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import {TaxoniumWrapper} from 'taxonium'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <div className="w-full h-full flex">
          <TaxoniumWrapper />
        </div>
      </div>
    </>
  )
}

export default App
