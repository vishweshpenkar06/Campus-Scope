import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'CampusScope — college research with sourced cutoff data'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f7f3ec',
          color: '#16213a',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              background: '#17315f',
              color: '#f7f3ec',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            CS
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
            CampusScope
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 74, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, maxWidth: 980 }}>
            Choose a college with your eyes open.
          </div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 28, color: '#5b6475', maxWidth: 900 }}>
            Sourced cutoffs, explainable predictions, and a shortlist you can defend.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #d9d2c5', paddingTop: 24 }}>
          <div style={{ display: 'flex', fontSize: 22, color: '#5b6475' }}>
            Maharashtra engineering admissions · every number has a citation
          </div>
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 700 }}>campusscope</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
