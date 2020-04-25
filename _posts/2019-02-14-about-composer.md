---
layout: post
title:  "关于composer"
date:   2019-02-14 15:25:26 +0800
tag: code
---

在这里我来记录一下我关于composer的一些知识点实践。首先我做以下一系列操作使用composer安装一个叫做monolog的包，然后写一个例子使用这个包, 以这里为切入点去理解composer。
- 1:
    - 创建一个叫做test的空文件夹,然后将当前路径切换到这个文件夹
    ```shell
    mkdir test
    cd test
    ```
    - 安装monolog包，composer会自动生成一些文件
    ```shell
    composer require monolog/monolog
    ls
    composer.json composer.lock vendor
    ```
    - 创建一个test.php文件从中去加载composer包集合，然后引入monolog模块并使用
    
    ```php
    <?php

    require __DIR__.'/vendor/autoload.php';

    use Monolog\Logger;
    use Monolog\Handler\StreamHandler;

    // create a log channel
    $log = new Logger('name');
    $log->pushHandler(new StreamHandler('path/to/your.log', Logger::WARNING));

    // add records to the log
    $log->warning('Foo');
    $log->error('Bar');

    echo "hello world\n";

    ?>
    ```
