import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const socialImageSize = { width: 1200, height: 630 };

const [poppinsRegular, poppinsSemibold, waypointMark] = await Promise.all([
  readFile(join(process.cwd(), 'node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff')),
  readFile(join(process.cwd(), 'node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff')),
  readFile(join(process.cwd(), 'public/brand/waypoint-mark.svg'), 'base64'),
]);

export function createSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#e9e5d8',
          color: '#17201e',
          display: 'flex',
          fontFamily: 'Poppins',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            background: '#102c2c',
            display: 'flex',
            height: '100%',
            position: 'absolute',
            right: 0,
            top: 0,
            width: 252,
          }}
        />
        <div
          style={{
            border: '2px solid #bd9348',
            display: 'flex',
            height: 526,
            left: 52,
            position: 'absolute',
            top: 52,
            width: 1096,
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
            padding: '76px 310px 72px 78px',
            width: '100%',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: 20 }}>
            <img
              alt=""
              height={74}
              src={`data:image/svg+xml;base64,${waypointMark}`}
              width={74}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 29, fontWeight: 600 }}>Logbook Waypoint</span>
              <span style={{ color: '#3f8580', fontSize: 18 }}>A tool from the Logbook for Devs</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: 66, fontWeight: 600, letterSpacing: '-2px', lineHeight: 1.04 }}>
              <span>Pin the point.</span>
              <span>Chart the change.</span>
            </div>
            <div style={{ color: '#3d4b47', display: 'flex', fontSize: 25, lineHeight: 1.4 }}>
              Local-first visual feedback your coding agent can act on.
            </div>
          </div>

          <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
            <span style={{ background: '#c94f35', borderRadius: 999, display: 'flex', height: 13, width: 13 }} />
            <span style={{ color: '#3f8580', fontSize: 18, letterSpacing: '1.5px' }}>ANNOTATION · QUEUE · RESOLUTION</span>
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            position: 'absolute',
            right: 79,
            top: 112,
          }}
        >
          {[0, 1, 2].map((index) => (
            <div key={index} style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <span
                style={{
                  background: index === 0 ? '#c94f35' : index === 1 ? '#3f8580' : '#bd9348',
                  border: '2px solid #e9e5d8',
                  borderRadius: 999,
                  display: 'flex',
                  height: 36,
                  width: 36,
                }}
              />
              {index < 2 && <span style={{ background: '#bd9348', display: 'flex', height: 94, width: 2 }} />}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...socialImageSize,
      fonts: [
        { name: 'Poppins', data: poppinsRegular, style: 'normal', weight: 400 },
        { name: 'Poppins', data: poppinsSemibold, style: 'normal', weight: 600 },
      ],
    },
  );
}
