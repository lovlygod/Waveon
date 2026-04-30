# Troubleshooting

## ffmpeg not found

- Ensure ffmpeg is installed.
- Add ffmpeg to PATH or configure ffmpeg path in your environment.

## Import fails

- Verify SoundCloud URL format.
- Retry with a public playlist URL.

## Missing output audio file

- Check that yt-dlp is installed and available.
- Validate ffmpeg is accessible from the same shell that runs Electron.

## Build issues

- Run `npm run typecheck`.
- Remove `node_modules` and reinstall dependencies.

## App opens links inside window

- Ensure external URL handling is enabled in main process.
- Restart the app after updating Electron main code.


