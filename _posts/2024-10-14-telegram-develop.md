---
layout: post
title:  Telegram开发
date:   2024-10-14 03:55:00 +0800
tag:    skill
---

游戏连接与telegram用户的绑定
    
首先玩家通过机器人发来的小游戏简介窗口点击请求进入小游戏，然后小游戏服务器收到进入的请求可以将message.from.id（telegram用户唯一ID）存到数据库，表示注册这个用户，同时生成这个telegram用户唯一ID对应的uid与验证令牌，下次进入时检测到已经注册就只需要更新令牌就好了。玩家打开游戏后连接登陆游戏时将uid与token发送给小游戏服务器对比token如果一致就登陆成功，游戏中就通过游戏地址链接上get请求的参数重拿到uid与token，登陆成功后可将token缓存起来重连的时候用。



- Telegram Bot设置hook
    ```bash
    TELEGRAM_BOT_TOKEN="987654321:AAGrbbbbbbbbbbbbbbX44dSXccccc"
    curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook \
    -d url=https://tgbot.mrzworld.online/portal \
    -d allowed_updates=\[\"message\",\"callback_query\"\]
    
    curl -X GET https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo
    ```

    
- Thinks:
    - https://grammy.dev/zh/guide/games
