import { getBuildStamp, formatBuildStampText } from '@/server/build-info'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const stamp = getBuildStamp()
  return new Response(formatBuildStampText(stamp), {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-openteque-build': stamp.buildId,
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}
