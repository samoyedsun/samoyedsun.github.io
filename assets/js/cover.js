// this file is auto generated.
// to random a cover image.

var covers = [['/assets/images/covers/2431442046.jpg', ''], ['/assets/images/covers/2431442301.jpg', ''], ['/assets/images/covers/2511755732.jpg', ''], ['/assets/images/covers/2431584704.jpg', ''], ['/assets/images/covers/2431584622.jpg', ''], ['/assets/images/covers/2431441940.jpg', '长湴公园'], ['/assets/images/covers/2511753621.jpg', '大南山'], ['/assets/images/covers/2431442338.jpg', '珠海'], ['/assets/images/covers/2431584680.jpg', '高雄'], ['/assets/images/covers/2511754082.jpg', '金地院'], ['/assets/images/covers/2431442318.jpg', ''], ['/assets/images/covers/2431442130.jpg', ''], ['/assets/images/covers/2431441939.jpg', ''], ['/assets/images/covers/2431442034.jpg', ''], ['/assets/images/covers/2431441843.jpg', '七星潭']]

    var i = Math.floor(Math.random() * covers.length);
    
    document.getElementById("cover-image").setAttribute("src", covers[i][0])

    