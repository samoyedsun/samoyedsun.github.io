---
layout: post
title:  "安卓APP拆包封包"
date:   2021-06-11 04:20:26 +0800
tag:    notes
---

安装:
```bash
brew install apktool
brew install java
```

使用zip压缩
```bash
zip -r filename.zip filesdir
```
使用unzip解压
```
unzip filename.zip
```

解包:
```bash
apktool d weixing.apk
```

打包:
```bash
apktool b ./weixing -o ./weixing.apk
```

apk证书生成:
```
keytool -genkey -alias android.keystore -keyalg RSA -validity 36500 -keystore android.keystore
keytool -importkeystore -srckeystore android.keystore -destkeystore android.keystore -deststoretype pkcs12
```

签名:
```bash
jarsigner -verbose -keystore android.keystore -signedjar newweixing.apk weixing.apk android.keystore
```