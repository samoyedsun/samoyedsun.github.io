---
layout: post
title:  "使用http api开发docker"
date:   2019-09-04 21:29:43 +0800
tag: notes
---

### 环境: ubuntu 18.04

docker的安装这里就不赘述了.

- 修改docker服务
    ```bash
    vim /lib/systemd/system/docker.service
    #注释以下内容
    #ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
    #添加以下内容
    ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:2375 -H fd:// --containerd=/run/containerd/containerd.sock
    ```
- 让配置生效
    ```bash
    systemctl daemon-reload
    systemctl restart docker
    ```

- 查看所有镜像
    ```bash
    curl http://localhost:2375/images/json | json_pp
    ```

- 查看所有容器
    ```bash
    curl http://localhost:2375/containers/json?all=1 | json_pp
    ```

- 重启指定容器
    ```bash
    curl -X POST -H "Content-Type: application/json" http://localhost:2375/containers/e05d9754ca6a/restart?t=0
    ```

- 停止指定容器
    ```bash
    curl -X POST -H "Content-Type: application/json" http://localhost:2375/containers/e05d9754ca6a/stop?t=0
    ```

- 创建一个容器
    ```bash
    curl -X POST -d '{"Image"="dfuse"}' -H "Content-Type: application/json" http://localhost:2375/containers/create
    ```

- 启动指定容器
    ```bash
    curl -X POST -H "Content-Type: application/json" http://localhost:2375/containers/e05d9754ca6a/start
    ```

- 删除异常停止的docker容器
    ```bash
    docker rm `docker ps -a | grep Exited | awk '{print $1}'`   
    ```

- 删除名称或标签为none的镜像
    ```bash
    docker rmi -f  `docker images | grep '<none>' | awk '{print $3}'`
    ```

- 参考资料:
    - [https://docs.docker.com/engine/api/v1.24/](https://docs.docker.com/engine/api/v1.24/)
