// Turns footage into the frame bundles a scroll site plays.
//   node pack-frames.mjs <site-folder> --land <frames-folder | video-file> [--port <frames-folder | video-file>]
//                        [--frames 240] [--quality 72] [--scale 1] [--chunks 4]
// Photographs make much heavier frames than drawn scenes: for those use about --quality 45 --scale 0.85.
// A frames folder holds f0000.png, f0001.png ... (and, from the studio, anchors.json). A video file (a phone clip of the
// client's shop, a drone pass, an AI-made shot) is cut into --frames evenly spaced stills, cropped to fill 1440x810
// (land) or 810x1440 (port). Needs ffmpeg. Writes <site>/frames/: manifest.json, <set>-<k>.webp (each a run of WebP frames), poster-<set>.jpg.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const args = process.argv.slice(2), site = args[0], opt = {};
for (let i = 1; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];
if (!site || !opt.land) { console.error('usage: node pack-frames.mjs <site-folder> --land <frames-folder|video> [--port <frames-folder|video>]'); process.exit(1); }
const even = n => 2 * Math.round(n / 2), k = Number(opt.scale ?? 1), SIZE = { land: [even(1440 * k), even(810 * k)], port: [even(810 * k), even(1440 * k)] }, quality = String(opt.quality ?? 72), nChunks = Number(opt.chunks ?? 4);
const out = join(site, 'frames'); mkdirSync(out, { recursive: true });
const ff = a => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: ['ignore', 'inherit', 'inherit'] });
const manifest = { frames: 0, sets: {}, anchors: {} };
for (const set of ['land', 'port']) {
  const src = opt[set]; if (!src) continue;
  const [W, H] = SIZE[set], work = join(tmpdir(), `pack-${set}-${process.pid}`); rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true });
  if (statSync(src).isDirectory()) ff(['-framerate', '30', '-i', join(src, 'f%04d.png'), '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`, '-c:v', 'libwebp', '-quality', quality, '-compression_level', '5', join(work, 'f%04d.webp')]);
  else {
    const want = Number(opt.frames ?? 240), dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).toString());
    ff(['-i', src, '-vf', `fps=${want / dur},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`, '-frames:v', String(want), '-start_number', '0', '-c:v', 'libwebp', '-quality', quality, '-compression_level', '5', join(work, 'f%04d.webp')]);
  }
  const files = readdirSync(work).filter(f => f.endsWith('.webp')).sort(), per = Math.ceil(files.length / nChunks), index = [], chunks = []; let bytes = 0;
  // each bundle is WebP images one after another; it is named .webp because every web host serves that type
  for (let c = 0; c * per < files.length; c++) {
    const parts = []; let off = 0;
    for (const f of files.slice(c * per, (c + 1) * per)) { const b = readFileSync(join(work, f)); index.push([c, off, b.length]); parts.push(b); off += b.length; }
    const name = `${set}-${c}.webp`; writeFileSync(join(out, name), Buffer.concat(parts)); chunks.push(name); bytes += off;
  }
  ff(['-i', join(work, files[0]), '-q:v', '4', join(out, `poster-${set}.jpg`)]);
  manifest.frames = manifest.frames ? Math.min(manifest.frames, files.length) : files.length; manifest.sets[set] = { w: W, h: H, chunks, index };
  const an = statSync(src).isDirectory() && existsSync(join(src, 'anchors.json')) ? JSON.parse(readFileSync(join(src, 'anchors.json'), 'utf8')) : null; if (an) manifest.anchors[set] = an;
  rmSync(work, { recursive: true, force: true });
  console.log(`${set}: ${files.length} frames, ${(bytes / 1e6).toFixed(1)} MB in ${chunks.length} files`);
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest));
