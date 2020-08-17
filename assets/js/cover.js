// this file is auto generated.
// to random a cover image.

var covers = [
    ['/assets/images/covers/IMG_20200616_175913.jpg', '珠海'],
    ['/assets/images/covers/IMG_20200618_154809.jpg', '珠海'],
    ['/assets/images/covers/IMG_20200627_202355.jpg', '珠海'],
    ['/assets/images/covers/IMG_20200628_140343.jpg', '珠海'],
    ['/assets/images/covers/IMG_20200628_140436.jpg', '珠海'],
    ['/assets/images/covers/IMG_20200628_143833.jpg', '珠海'],
    ['/assets/images/covers/IMG_20200628_143852.jpg', '珠海'],
    ['/assets/images/covers/IMG_20200628_144043.jpg', '珠海'],
    ['/assets/images/covers/IMG_20200628_144406.jpg', '珠海']
]

    var i = Math.floor(Math.random() * covers.length);
    
    document.getElementById("cover-image").setAttribute("src", covers[i][0])

    