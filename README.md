# A Meia-Noite

An illustrated birthday castle built with React, Vite and Framer Motion.
Explore rooms through objects in the scene. The living room connects four
musical dedications and a final birthday gift. Wide scenes can be panned on
mobile, with touch dragging or camera arrows.

Vinny accompanies visitors inside the castle. Tapping the floor sends her there;
selecting an object makes her walk to it before opening it. She waves when tapped,
reacts to discoveries, and follows the mouse with directional poses on desktop.
Reduced-motion preferences skip walking. A missing sprite never blocks navigation.

## Run

```sh
npm install
npm run dev
```

## Personalize

Edit `src/content.js`:

- `gift.recipient`: recipient name.
- `gift.letter`, `gift.signature`: birthday letter and signature.
- `gift.playlistUrl`: complete Spotify playlist link.
- `gift.playlistCover`: optional custom playlist image.
- Each dedication's `song`, `artist`, `note` and `caption`.
- `audioUrl`: directly playable audio file, for example `/music/song.mp3`.
- `spotifyUrl`: song's Spotify link.
- `cover`, `photo`: artwork and personal photo paths.

Music and playlist URLs are empty by design. No Hozier track or previous invite
notifications are connected to the new experience. Empty photo slots show the
room illustration until personal photos are supplied.

Discoveries are saved locally on the visitor's device. The journal can reset
them. No responses or photos are sent to an external service.

## Build And Render

```sh
npm run build
```

For a Render static site, use `npm install && npm run build` as the build
command and `dist` as the publish directory. Keep Root Directory empty.

## Art And Previous Project

See `docs/ART-SOURCES.md` for artwork provenance. The five supplied references
are preserved with the complementary existing artwork. No generated backgrounds
are used. Original image files live in `assets/castle-sources`. Sharpened WebP
exports include high-density versions; the blurry hall source limits true detail.
Vinny's original sheet is preserved in `assets/pet-source`.

The previous Resident Evil cinema invite is preserved in the Git branch
`archive/resident-evil-invite`.
