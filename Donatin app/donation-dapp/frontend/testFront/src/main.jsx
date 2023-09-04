import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { MetaMaskProvider } from 'metamask-react'
import { EthersProvider } from './utils/EtherContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MetaMaskProvider>
      <EthersProvider>
        <App />
      </EthersProvider>    
    </MetaMaskProvider>
  </React.StrictMode>,
)
