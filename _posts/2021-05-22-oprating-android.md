---
layout: post
title:  "mac平台命令行操作安卓"
date:   2021-05-22 17:07:26 +0800
tag: notes
---

- mac上命令行操作安卓:
    ```
    brew tap homebrew/cask
    brew install --cask android-platform-tools
    # 然后use连接手机开启开发者模式
    adb devices
    # 设置目标设备以监听端口 5555 上的 TCP/IP 连接。
    adb tcpip 5555
    # 通过 IP 地址连接到设备
    adb connect 192.168.0.131
    # 确认主机已连接到目标设备：
    adb devices
    # 然后进入安卓系统终端操作
    adb shell

    # 小米手机开启root相关资料:https://www.xiaomi.cn/post/4471505
    adb root
    adb shell

    # 如果 adb 连接断开：
    # 1.确保主机仍与 Android 设备连接到同一个 WLAN 网络。
    # 2.通过再次执行 adb connect 步骤重新连接。
    # 3.如果上述操作未解决问题，重置 adb 主机：
    adb kill-server
    # 然后，从头开始操作。
    ```