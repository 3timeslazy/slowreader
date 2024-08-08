import type { AppMessage, ExtensionMessage } from './api.js'
import { config } from './config.js'

const FETCH_TIMEOUT_MS = 30000

const sendMessage = (
  port: chrome.runtime.Port,
  message: ExtensionMessage
): void => {
  port.postMessage(message)
}

chrome.runtime.onConnectExternal.addListener(port => {
  if (port.sender?.origin === config.HOST) {
    sendMessage(port, { type: 'connected' })
    port.onMessage.addListener(async (message: AppMessage) => {
      if (message.url) {
        await fetch(message.url, {
          ...message.options,
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        })
          .then(data => {
            sendMessage(port, { data, type: 'fetched' })
          })
          .catch(error => {
            sendMessage(port, {
              data: null,
              error: error.toString(),
              type: 'error'
            })
          })
      }
      return true
    })
  }
})
