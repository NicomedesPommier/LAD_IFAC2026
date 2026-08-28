# Road textures

Drop image files here using these **exact** names. They are picked up
automatically by `../textures.js` (webpack `require.context`). Until a file
exists, the editor uses a themed flat-color fallback, so nothing breaks if a
texture is missing.

## Road surfaces
| name           | what it is            |
|----------------|-----------------------|
| `asphalt.jpg`  | base asphalt          |
| `trace.webp`   | worn asphalt ("wear") |
| `wear2.webp`   | light wear            |
| `crossing.png` | crossing texture      |
| `bus.png`      | bus lane surface      |
| `bike.png`     | bike lane surface     |

## Surface fills
`zebra.png`, `damier.png` (checkerboard), `plain.jpg`

## Lines
`continue.png`, `t1.png`, `t2.png`, `cedez.png` (yield), `stop.png`,
`line.png` (used), `line_parking.png`

## Markings
`arrow.png`, `arrow_left.png`, `arrow_right.png`, `bus_place.png`,
`bus_text.webp`, `bike_sign.png`

## Medians
`median_border.jpg`, `median_bevel.jpg`

> These are the same file names PathPhalt uses, so its texture choices in a
> loaded JSON map straight onto your files.
