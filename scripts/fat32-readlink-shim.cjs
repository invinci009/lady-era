/**
 * FAT32/exFAT readlink workaround (dev/build only).
 *
 * Root cause: this project lives on a FAT32 volume, which has no symlinks.
 * Node's fs.readlink() on a regular file returns EINVAL on NTFS but EISDIR
 * on FAT32. Webpack's module resolver (enhanced-resolve) probes every file
 * with readlink and only treats EINVAL/ENOENT as "not a symlink" — EISDIR
 * propagates as a fatal build error.
 *
 * This shim normalizes EISDIR to EINVAL so resolvers correctly treat every
 * path as "not a symlink". Semantically safe: symlinks cannot exist on
 * FAT32, so "not a symlink" is always the right answer.
 *
 * Permanent fix: move the project to an NTFS volume (then this shim and the
 * --webpack flags can be removed; Turbopack also requires NTFS junctions).
 *
 * Loaded via: node --require ./scripts/fat32-readlink-shim.cjs
 */
const fs = require('fs')

function normalizeReadlinkError(err) {
  if (err && err.code === 'EISDIR') {
    err.code = 'EINVAL'
  }
  return err
}

// Callback-style fs.readlink
const origReadlink = fs.readlink
fs.readlink = function (p, ...args) {
  const cb = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null
  if (!cb) return origReadlink.call(this, p, ...args)
  args[args.length - 1] = function (err, ...rest) {
    return cb(normalizeReadlinkError(err), ...rest)
  }
  return origReadlink.call(this, p, ...args)
}

// Sync fs.readlinkSync
const origReadlinkSync = fs.readlinkSync
fs.readlinkSync = function (...args) {
  try {
    return origReadlinkSync.apply(this, args)
  } catch (err) {
    throw normalizeReadlinkError(err)
  }
}

// Promise-style fs.promises.readlink (bypasses fs.readlink internally)
if (fs.promises && typeof fs.promises.readlink === 'function') {
  const origPromiseReadlink = fs.promises.readlink
  fs.promises.readlink = async function (...args) {
    try {
      return await origPromiseReadlink.apply(this, args)
    } catch (err) {
      throw normalizeReadlinkError(err)
    }
  }
}
