"use client"

import ErrorHandler from "@/components/error-handler"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <ErrorHandler error={error} reset={reset} />
      </body>
    </html>
  )
}
