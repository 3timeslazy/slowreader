import type { BaseServer } from '@logux/server'
import type { Endpoint } from '@slowreader/api'
import type { IncomingMessage, ServerResponse } from 'node:http'

function badRequest(res: ServerResponse, msg: string): true {
  res.writeHead(400, { 'Content-Type': 'text/plain' })
  res.end(msg)
  return true
}

function collectBody(req: IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
    })
    req.on('end', async () => {
      resolve(data)
    })
  })
}

export function jsonApi<Response, Request extends object>(
  server: BaseServer,
  endpoint: Endpoint<Response, Request>,
  listener: (
    params: Request,
    res: ServerResponse,
    req: IncomingMessage
  ) => false | Promise<false> | Promise<Response> | Response
): void {
  server.http(async (req, res) => {
    if (req.method === endpoint.method) {
      let url = new URL(req.url ?? '/', 'http://localhost')
      let urlParams = endpoint.parseUrl(url.pathname)
      if (urlParams) {
        if (req.headers['content-type'] !== 'application/json') {
          return badRequest(res, 'Wrong content type')
        }
        let data = await collectBody(req)
        let body: unknown
        try {
          body = JSON.parse(data)
        } catch {
          return badRequest(res, 'Invalid JSON')
        }
        let validated = endpoint.checkBody(body, urlParams)
        if (!validated) {
          return badRequest(res, 'Invalid body')
        }
        let answer = await listener(validated, res, req)
        if (answer === false) {
          return badRequest(res, 'Invalid request')
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(answer))

        return true
      }
    }
    return false
  })
}
