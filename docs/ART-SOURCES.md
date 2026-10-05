# Art Sources

No generated backgrounds are used in the birthday experience. The earlier generated
experiments were removed from the project after the visual direction changed.

## Images supplied by the user

- `library.png`: clipboard `0fb71e32-ed89-4907-9383-0ed54c7f272c`, gothic library concept art. Original artist not verified.
- `chapel.png`: clipboard `c5d329e3-d7fe-4ca5-9f5d-f4df2b2b00fc`, gothic stained glass hall. Original artist not verified.
- `lounge.png`: clipboard `e27e8e82-4928-4890-81ee-c3ef9141b62a`, Vampire Therapist environment by Barbara Langa.
- `dining.png`: clipboard `b6a88587-8afd-440d-a0f9-ed42b587ce5f`, gothic banquet hall. Original artist not verified.
- `hall.jpg`: user-supplied `download (8).jpg`, portrait castle living room. Original artist not verified.
- `exterior.jpg`: user-supplied Gothic Dark Castle Wallpaper, moonlit monochrome castle. Original artist not verified. Replaces the previous entrance illustration.

## Complementary existing artwork

- `exterior-original.jpg`: previous entrance, preserved as an unused source; Castlevania Season 2 background, Jose Vega's portfolio.
  Source: https://www.behance.net/gallery/72425209/Castlevania-Season-2-Backgrounds
  Image: https://mir-s3-cdn-cf.behance.net/project_modules/hd/8e076572425209.5be6f1aece3d8.jpg
- `secret.png`: Vampire Therapist room, Barbara Langa.
  Source: https://bat-gold-xw2l.squarespace.com/clientwork
  Image: https://images.squarespace-cdn.com/content/v1/661e7e07b40cee52e72cedf2/7e93aa09-6fef-4a5a-ac9f-b822af78fa9b/kroom_1_logo.png

Art remains attributed to its original creators. Public availability does not
establish a redistribution license. Original artist watermarks are preserved.
WebP backgrounds have light exposure adjustment and traditional sharpening.
High-density versions use Lanczos resizing, not generative enhancement. Resizing
does not recover missing original detail, particularly in the blurry hall photo.
No generative edits, outpainting or redraws were performed.

Unmodified source images are preserved in `assets/castle-sources`. Only optimized
WebP files in `public/castle` are loaded by the experience.

## Vinny

The user supplied the animated pet sheet from
`Documents/Codex/2026-10-04/pets-plugin-work-pets-openai-curated/outputs/vinny-8bit-spritesheet.png`.
The untouched copy is in `assets/pet-source`. `public/pet/vinny.webp` is a
lossless, transparent export of the same 1536 x 2288 sheet. The 8 x 11 grid has
192 x 208 cells. No character artwork was changed or generated for integration.

## Interaction references

- Rusty Lake / Cube Escape: https://www.rustylake.com/
- Haunted House, Kelby Gassman: https://dribbble.com/shots/5711627-Haunted-House

## Personalization

`src/content.js` holds the recipient name, letters, four song entries, photo URLs
and the final playlist URL. Music URLs are intentionally empty until the user
provides their selections. Playback and external links are only available when
their corresponding URLs are configured.

Local files can be placed in `public/music` and `public/photos`; reference them
as `/music/filename.mp3` and `/photos/filename.jpg`. Remote Spotify links belong
in `spotifyUrl` or `playlistUrl`, not `audioUrl`.

The previous cinema invite is preserved in the Git branch
`archive/resident-evil-invite`.
