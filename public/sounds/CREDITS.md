# Sound credits

All sounds come from [Freesound.org](https://freesound.org). Every source was checked on its sound page and is released under **Creative Commons 0 (CC0 1.0, public domain dedication)**, so no attribution is required. Credits are listed anyway for provenance.

Processing was done with ffmpeg + numpy from the Freesound HQ previews (128 kbps MP3): silence trim, short fades, loudness normalisation (UI/one-shots ≈ -18 LUFS integrated or peak-limited at ≤ -1 dBTP when too short to measure; ambient ≈ -24 LUFS), re-encoded with libmp3lame at 44.1 kHz (128 kbps for ambient/cinematic, 96 kbps for UI).

| File | Cue | Freesound title | Author | Page | License | Original duration | Final duration | Processing |
|---|---|---|---|---|---|---|---|---|
| `intro_ambient.mp3` | intro_ambient | drone0015.flac | Trebblofang | https://freesound.org/people/Trebblofang/sounds/177114/ | CC0 1.0 (verified) | 120.00 s | 48.00 s | Took 10–64 s of the source; made a seamless loop of 48 s by equal-power crossfading the 6 s that follow the loop end into the head; normalised to -24 LUFS; stereo 128 kbps. No fade-in baked in (it would dip on every loop) — fade in with a gain ramp in code. |
| `flyby_1.mp3` | flyby_1 | Cinematic Woosh SFX-011.wav | AudioPapkin | https://freesound.org/people/AudioPapkin/sounds/648732/ | CC0 1.0 (verified) | 2.31 s | 1.81 s | trim silence, shortened to 1.85 s with fade-out, fade in 30 ms / out 300 ms, gain -5.3 dB, stereo, 128 kbps |
| `flyby_2.mp3` | flyby_2 | Planetary Flyby faster.aif | mattpavone | https://freesound.org/people/mattpavone/sounds/76175/ | CC0 1.0 (verified) | 3.60 s | 2.53 s | segment 0.00–2.55 s, trim silence, fade in 40 ms / out 700 ms, gain -8.0 dB, stereo, 128 kbps |
| `riser.mp3` | riser | Riser sound effect short.wav | syntheffects | https://freesound.org/people/syntheffects/sounds/685256/ | CC0 1.0 (verified) | 3.05 s | 2.57 s | trim silence, shortened to 2.61 s with fade-out, fade in 50 ms / out 12 ms, gain +3.9 dB, stereo, 128 kbps |
| `impact.mp3` | impact | Cinematic_Boom_Rhapsodize.wav | rhapsodize | https://freesound.org/people/rhapsodize/sounds/255111/ | CC0 1.0 (verified) | 7.73 s | 5.00 s | trim silence, shortened to 5.04 s with fade-out, fade in 2 ms / out 1500 ms, gain -1.1 dB, stereo, 128 kbps |
| `shimmer.mp3` | shimmer | GLEAM-GLOW-SFX-CHIME.wav | newagesoup | https://freesound.org/people/newagesoup/sounds/351408/ | CC0 1.0 (verified) | 5.38 s | 3.00 s | trim silence, shortened to 3.03 s with fade-out, fade in 20 ms / out 700 ms, gain +8.9 dB, stereo, 128 kbps |
| `start.mp3` | start | Fast Warp In | GammaGool | https://freesound.org/people/GammaGool/sounds/735062/ | CC0 1.0 (verified) | 1.23 s | 0.91 s | trim silence, fade in 10 ms / out 300 ms, gain -7.5 dB, stereo, 128 kbps |
| `keys_1.mp3` | keys | Mechanical Keyboard Typing Sound | olehenriksen | https://freesound.org/people/olehenriksen/sounds/771251/ | CC0 1.0 (verified) | 66.86 s | 0.12 s | Single key press cut at 56.319 s of the source (60 Hz high-pass, cut tight around the transient, ≤120 ms, 3 ms fade in/out); all 8 matched to equal RMS; peak ≈ -4 dBFS; mono 96 kbps. |
| `keys_2.mp3` | keys | Mechanical Keyboard Typing Sound | olehenriksen | https://freesound.org/people/olehenriksen/sounds/771251/ | CC0 1.0 (verified) | 66.86 s | 0.11 s | Single key press cut at 53.764 s of the source (60 Hz high-pass, cut tight around the transient, ≤120 ms, 3 ms fade in/out); all 8 matched to equal RMS; peak ≈ -4 dBFS; mono 96 kbps. |
| `keys_3.mp3` | keys | Mechanical Keyboard Typing Sound | olehenriksen | https://freesound.org/people/olehenriksen/sounds/771251/ | CC0 1.0 (verified) | 66.86 s | 0.12 s | Single key press cut at 50.564 s of the source (60 Hz high-pass, cut tight around the transient, ≤120 ms, 3 ms fade in/out); all 8 matched to equal RMS; peak ≈ -4 dBFS; mono 96 kbps. |
| `keys_4.mp3` | keys | Mechanical Keyboard Typing Sound | olehenriksen | https://freesound.org/people/olehenriksen/sounds/771251/ | CC0 1.0 (verified) | 66.86 s | 0.11 s | Single key press cut at 19.013 s of the source (60 Hz high-pass, cut tight around the transient, ≤120 ms, 3 ms fade in/out); all 8 matched to equal RMS; peak ≈ -4 dBFS; mono 96 kbps. |
| `keys_5.mp3` | keys | Mechanical Keyboard Typing Sound | olehenriksen | https://freesound.org/people/olehenriksen/sounds/771251/ | CC0 1.0 (verified) | 66.86 s | 0.11 s | Single key press cut at 59.952 s of the source (60 Hz high-pass, cut tight around the transient, ≤120 ms, 3 ms fade in/out); all 8 matched to equal RMS; peak ≈ -4 dBFS; mono 96 kbps. |
| `keys_6.mp3` | keys | Mechanical Keyboard Typing Sound | olehenriksen | https://freesound.org/people/olehenriksen/sounds/771251/ | CC0 1.0 (verified) | 66.86 s | 0.10 s | Single key press cut at 41.291 s of the source (60 Hz high-pass, cut tight around the transient, ≤120 ms, 3 ms fade in/out); all 8 matched to equal RMS; peak ≈ -4 dBFS; mono 96 kbps. |
| `keys_7.mp3` | keys | Mechanical Keyboard Typing Sound | olehenriksen | https://freesound.org/people/olehenriksen/sounds/771251/ | CC0 1.0 (verified) | 66.86 s | 0.10 s | Single key press cut at 16.818 s of the source (60 Hz high-pass, cut tight around the transient, ≤120 ms, 3 ms fade in/out); all 8 matched to equal RMS; peak ≈ -4 dBFS; mono 96 kbps. |
| `keys_8.mp3` | keys | Mechanical Keyboard Typing Sound | olehenriksen | https://freesound.org/people/olehenriksen/sounds/771251/ | CC0 1.0 (verified) | 66.86 s | 0.12 s | Single key press cut at 42.067 s of the source (60 Hz high-pass, cut tight around the transient, ≤120 ms, 3 ms fade in/out); all 8 matched to equal RMS; peak ≈ -4 dBFS; mono 96 kbps. |
| `ui_click.mp3` | ui_click | UI Button Click | benzix2 | https://freesound.org/people/benzix2/sounds/467951/ | CC0 1.0 (verified) | 0.12 s | 0.10 s | trim silence, fade in 1 ms / out 20 ms, gain +6.5 dB, mono, 96 kbps |
| `matrix.mp3` | matrix | Glitch | AmicaSys | https://freesound.org/people/AmicaSys/sounds/332711/ | CC0 1.0 (verified) | 2.00 s | 2.00 s | trim silence, fade in 3 ms / out 150 ms, gain -1.4 dB, stereo, 128 kbps |
| `unicorn.mp3` | unicorn | Cliche Magic Spell Sound | qubodup | https://freesound.org/people/qubodup/sounds/817466/ | CC0 1.0 (verified) | 2.16 s | 2.16 s | trim silence, fade in 10 ms / out 400 ms, gain +2.1 dB, mono, 96 kbps |
| `alarm.mp3` | alarm | Buzzer sounds (Wrong answer / Error) | Breviceps | https://freesound.org/people/Breviceps/sounds/493163/ | CC0 1.0 (verified) | 2.77 s | 1.31 s | segment 0.00–1.33 s, lowpass f 7000, trim silence, fade in 3 ms / out 40 ms, gain -2.4 dB, mono, 96 kbps |
| `egg_found.mp3` | egg_found | achievement-sparkle | SkySpeira | https://freesound.org/people/SkySpeira/sounds/715067/ | CC0 1.0 (verified) | 1.76 s | 1.37 s | trim silence, fade in 3 ms / out 400 ms, gain +19.6 dB, stereo, 96 kbps |
| `fall_whistle.mp3` | fall_whistle | Cartoon Fall | plasterbrain | https://freesound.org/people/plasterbrain/sounds/395443/ | CC0 1.0 (verified) | 2.05 s | 2.00 s | trim silence, fade in 10 ms / out 150 ms, gain -7.0 dB, mono, 96 kbps |
| `thud_1.mp3` | thud_1 | soft-hit.wav | Krokulator | https://freesound.org/people/Krokulator/sounds/653910/ | CC0 1.0 (verified) | 0.26 s | 0.25 s | trim silence, fade in 1 ms / out 80 ms, gain -1.1 dB, mono, 96 kbps |
| `thud_2.mp3` | thud_2 | Pillow Smash.mp3 | daymonjlong | https://freesound.org/people/daymonjlong/sounds/344669/ | CC0 1.0 (verified) | 0.64 s | 0.30 s | trim silence, fade in 1 ms / out 100 ms, gain -1.2 dB, mono, 96 kbps |
| `zap.mp3` | zap | Gun, Laser, Single Shot, Sci Fi | Kinoton | https://freesound.org/people/Kinoton/sounds/351429/ | CC0 1.0 (verified) | 1.58 s | 0.44 s | trim silence, shortened to 0.47 s with fade-out, fade in 2 ms / out 120 ms, gain +0.2 dB, mono, 96 kbps |
| `flashlight.mp3` | flashlight | Small_Flashlight_Click_on_Fast.wav | Rudmer_Rotteveel | https://freesound.org/people/Rudmer_Rotteveel/sounds/502506/ | CC0 1.0 (verified) | 0.13 s | 0.13 s | trim silence, fade in 1 ms / out 15 ms, gain +11.9 dB, mono, 96 kbps |
| `yelp.mp3` | yelp | Cartoony Scream - Character Knocked Out (3 of 3) | el_boss | https://freesound.org/people/el_boss/sounds/751702/ | CC0 1.0 (verified) | 1.24 s | 1.00 s | trim silence, fade in 5 ms / out 250 ms, gain +2.6 dB, mono, 96 kbps |

Notes:
- MP3 has encoder delay/padding; decode with Web Audio (`decodeAudioData`) and use `AudioBufferSourceNode.loop = true` for `intro_ambient` — browsers strip the LAME gapless header there. `<audio loop>` may leave a tiny gap.
- Why each source was chosen:
  - **intro_ambient** — Deep melodic cinematic drone (D-chord, strong sub, steady level) — calm, no beats/voices.
  - **flyby_1** — Cinematic woosh with a symmetric swell-and-fade pass-by envelope.
  - **flyby_2** — "A large object moving past", low rumble planetary flyby.
  - **riser** — Noise riser that brightens and ends abruptly on its peak (no hit).
  - **impact** — Low trailer boom with long natural decay; very popular (19K dl).
  - **shimmer** — Airy high "gleam/glow" chime shimmer with soft swell.
  - **start** — Short warp-in whoosh with a tonal bloom.
  - **keys** — Clean Zoom H4n recording of a Cooler Master mechanical keyboard; well-separated strokes, very low noise floor.
  - **ui_click** — Soft, short, mid-frequency button click (not harsh).
  - **matrix** — Dense data-bending glitch burst.
  - **unicorn** — Music-box-comb magic glissando / sparkle.
  - **alarm** — Classic double error buzz ("access denied").
  - **egg_found** — Short sparkly C-major success arpeggio.
  - **fall_whistle** — Descending slide whistle, made for "character falling off a cliff".
  - **thud_1** — Soft low thump.
  - **thud_2** — Pillow smash — soft cushioned "poof" hit.
  - **zap** — Single sci-fi laser shot / zap.
  - **flashlight** — Small real flashlight button click.
  - **yelp** — Short cartoony voice scream ("character knocked out").
