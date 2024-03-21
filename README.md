# bga-festi-vibes
Festi’vibes board game adaptation for BoardGameArena.com

mogrify -path ./cropped -shave 30x30 -quality 100 \*.jpg
montage `ls -v .` -tile 6 -geometry 238x439+0+0 festivalCardsFront.jpg
montage `ls -v .` -tile 13 -geometry 238x439+0+0 eventCards.jpg
montage `ls -v .` -tile 4 -geometry 171x262+0+0 ticketsCards.jpg
