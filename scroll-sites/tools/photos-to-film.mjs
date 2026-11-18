// Makes a scroll film from a folder of photographs: each photo drifts slowly and dissolves into the next.
//   node tools/photos-to-film.mjs <site-folder> --photos <folder> [--hold 2.4] [--fade 0.9] [--frames 240]
// Use it for a property listing, a restaurant, a salon: anything the client has good photos of. The photos are
// taken in name order (01-front.jpg, 02-hall.jpg ...) and cropped to fill the screen, landscape and upright.
// Needs ffmpeg. Afterwards set each chapter's "frames" in site.config.js: photo k is on screen around frame
// 240 * (k + 0.5) / (number of photos).
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const args = process.argv.slice(2), site = args[0], opt = {};
for (let i = 1; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];
if (!site || !opt.photos) { console.error('usage: node photos-to-film.mjs <site-folder> --photos <folder>'); process.exit(1); }
const photos = readdirSync(opt.photos).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort().map(f => join(opt.photos, f));
if (photos.length < 2) { console.error('need at least two photos in', opt.photos); process.exit(1); }
const hold = Number(opt.hold ?? 2.4), fade = Number(opt.fade ?? 0.9), T = hold + fade, FPS = 30, work = join(tmpdir(), `photofilm-${process.pid}`); mkdirSync(work, { recursive: true });
const out = {};
for (const [set, W, H] of [['land', 1440, 810], ['port', 810, 1440]]) {
  const inputs = photos.flatMap(p => ['-i', p]), n = Math.round(T * FPS), parts = [];
  photos.forEach((_, k) => {
    // alternate a slow push in and a slow pull out, so the film never sits still
    const z = k % 2 ? `1.1-0.1*on/${n}` : `1+0.1*on/${n}`;
    parts.push(`[${k}:v]scale=${W * 3}:${H * 3}:force_original_aspect_ratio=increase,crop=${W * 3}:${H * 3},zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=${W}x${H}:fps=${FPS},format=yuv420p[v${k}]`);
  });
  let last = 'v0'; for (let k = 1; k < photos.length; k++) { parts.push(`[${last}][v${k}]xfade=transition=fade:duration=${fade}:offset=${(k * hold).toFixed(3)}[x${k}]`); last = `x${k}`; }
  out[set] = join(work, `${set}.mp4`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', parts.join(';'), '-map', `[${last}]`, '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', out[set]], { stdio: 'inherit' });
  console.log(set, 'film made from', photos.length, 'photos');
}
execFileSync('node', [join(dirname(fileURLToPath(import.meta.url)), 'pack-frames.mjs'), site, '--land', out.land, '--port', out.port, '--frames', String(opt.frames ?? 240)], { stdio: 'inherit' });
rmSync(work, { recursive: true, force: true });
