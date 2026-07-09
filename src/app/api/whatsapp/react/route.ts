/**
 * @deprecated Use POST /api/messages/react instead
 *
 * This endpoint is maintained for backward compatibility.
 * It will be removed in a future release.
 */
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const newUrl = new URL('/api/messages/react', request.url)

  // Clone the request to read the body without consuming it
  const clonedRequest = request.clone()

  // Forward the request to the new endpoint
  const response = await fetch(newUrl.toString(), {
    method: 'POST',
    headers: {
      ...Object.fromEntries(
        Array.from(request.headers.entries()).filter(
          ([key]) => key.toLowerCase() !== 'host'
        )
      ),
    },
    body: clonedRequest.body,
  })

  // Create the response with deprecation headers
  const responseHeaders = new Headers(response.headers)
  responseHeaders.set('Deprecation', 'true')
  responseHeaders.set(
    'Sunset',
    'Sat, 01 Jan 2028 00:00:00 GMT'
  )
  responseHeaders.set(
    'Link',
    '<https://docs.zynex.do/api/messages/react>; rel="successor-version"'
  )

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}
