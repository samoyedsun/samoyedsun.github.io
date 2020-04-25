#!/usr/bin/python3

import urllib.request
import json,random
import os.path
import shutil


#######
# gen cover images from douban album
#######

album_id = "1640488027"
max_covers = 15
photo_dir = "assets/images/covers/"
js_path = "assets/js/cover.js"

def gen_photos():
    ret = []
    resp = urllib.request.urlopen("https://api.douban.com/v2/album/%s/photos"%album_id)
    album = json.load(resp)

    n = len(album["photos"]) > max_covers and max_covers or len(album["photos"])
    photos = random.sample(album["photos"], n)

    for p in photos:
        r = urllib.request.urlopen(p["image"])
        path = os.path.join(photo_dir, p["id"]+".jpg")
        with open(path, "wb") as f:
            f.write(r.read())
            print("gen img:", path)
        ret.append(["/" + path, p["desc"]])
    print("total:", n)

    return ret

def gen_js(photos):
    chunk = "// this file is auto generated.\n" 
    chunk += "// to random a cover image.\n\n"
    chunk += "var covers = " + repr(photos) + "\n"
    chunk += '''
    var i = Math.floor(Math.random() * covers.length);
    
    document.getElementById("cover-image").setAttribute("src", covers[i][0])

    '''
    with open(js_path, "w") as f:
        f.write(chunk)
        print("gen js:", js_path)


if __name__ == "__main__":
    if os.path.exists(photo_dir):
        shutil.rmtree(photo_dir)
    os.makedirs(photo_dir)
    photos = gen_photos()
    gen_js(photos)
