---
layout: post
title:  centos7中docker启动失败
date:   2021-12-29 18:18:56 +0800
tag:    notes
---

今天策划跟我上司说要使用禅道跟进开发进度，我主动提出自己来搭建，因为之前搭建过，用docker一条命令即可搞定。同时我我考虑到公司内部的服务器系统版本比较老，提出在阿里云开一台服务器在上面搭建，结果被驳回，说内部有服务器，用公司的服务器就行。结果旧遇到了以下问题。

我执行命令:
```bash
docker ps -a
```

报错:starting container process caused "process_linux.go:258: applying cgroup configuration for process caused \"Cannot set property TasksAccounting, or unknown property.\"".

执行其他docker 命令也是报这个错误, 于是我百度查了一下，都说是centos系统版本与docker版本相比过旧导致，我也照百度上说的用yum update命令更新系统，试了几次没有成功，换源也不行，提示依赖找不到相关的问题，反正感觉解决起来挺麻烦的，折腾很久都没成功。

于是我换了一种方法，既然系统无法升级，那么我降低docker版本岂不是同样能达到目的。

先卸载已安装的docker版本
```bash
yum list installed | grep docker
yum -y remove docker-ce.x86_64
rm -rf /var/lib/docker
```

博客园上的一个靓仔告诉我先执行以下命令看看有没有可用的版本
```bash
yum list docker-ce --showduplicates | sort -r
```

要是啥都没有，就说明你没有整国内的镜像仓库, 可以执行以下命令整一个
```bash
curl -o /etc/yum.repos.d/Docker-ce-Ali.repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

先安装docker-ce-selinux-17.03.2.ce
```bash
yum install https://download.docker.com/linux/centos/7/x86_64/stable/Packages/docker-ce-selinux-17.03.2.ce-1.el7.centos.noarch.rpm
```

然后再安装 docker-ce-17.03.2.ce
```bash
yum install docker-ce-17.03.2.ce-1.el7.centos
```

再执行docker相关命令就不会报错了.