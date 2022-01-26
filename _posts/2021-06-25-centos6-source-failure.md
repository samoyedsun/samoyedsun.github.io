---
layout: post
title:  centos6源失效
date:   2021-06-25 14:57:46 +0800
tag:    notes
---

最近在接盘一个老项目，也不算太老，五年前而已，不过项目创建者用的centos6环境部署的，而我这边在他这个老项目的centos6镜像里安装一些新软件时发现yum源不能用了，换了网易的也不行，后面查资料了解到以下情况。

以下资料来自: https://developer.aliyun.com/article/779734

2020年11月30日 centos6各大开源镜像站已经停止维护了 但是阿里源还是可以用的 因为他的centos-vault仓库里放了之前版本的centos的包

只需要在centos命令行界面下执行一下几条命令
```bash
sed -i "s|enabled=1|enabled=0|g" /etc/yum/pluginconf.d/fastestmirror.conf
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
curl -o /etc/yum.repos.d/CentOS-Base.repo https://www.xmpan.com/Centos-6-Vault-Aliyun.repo 
yum clean all
yum makecache
```

然后在现在你会发现速度还是之前的速度, 下面再附上这个repo文件的内容
```plain
# CentOS-Base.repo
#
# The mirror system uses the connecting IP address of the client and the
# update status of each mirror to pick mirrors that are updated to and
# geographically close to the client.  You should use this for CentOS updates
# unless you are manually picking other mirrors.
#
# If the mirrorlist= does not work for you, as a fall back you can try the 
# remarked out baseurl= line instead.
#
#
 
[base]
name=CentOS-6.10 - Base - mirrors.aliyun.com
failovermethod=priority
baseurl=http://mirrors.aliyun.com/centos-vault/6.10/os/$basearch/
gpgcheck=1
gpgkey=http://mirrors.aliyun.com/centos-vault/RPM-GPG-KEY-CentOS-6
 
#released updates 
[updates]
name=CentOS-6.10 - Updates - mirrors.aliyun.com
failovermethod=priority
baseurl=http://mirrors.aliyun.com/centos-vault/6.10/updates/$basearch/
gpgcheck=1
gpgkey=http://mirrors.aliyun.com/centos-vault/RPM-GPG-KEY-CentOS-6
 
#additional packages that may be useful
[extras]
name=CentOS-6.10 - Extras - mirrors.aliyun.com
failovermethod=priority
baseurl=http://mirrors.aliyun.com/centos-vault/6.10/extras/$basearch/
gpgcheck=1
gpgkey=http://mirrors.aliyun.com/centos-vault/RPM-GPG-KEY-CentOS-6
 
#additional packages that extend functionality of existing packages
[centosplus]
name=CentOS-6.10 - Plus - mirrors.aliyun.com
failovermethod=priority
baseurl=http://mirrors.aliyun.com/centos-vault/6.10/centosplus/$basearch/
gpgcheck=1
enabled=0
gpgkey=http://mirrors.aliyun.com/centos-vault/RPM-GPG-KEY-CentOS-6
 
#contrib - packages by Centos Users
[contrib]
name=CentOS-6.10 - Contrib - mirrors.aliyun.com
failovermethod=priority
baseurl=http://mirrors.aliyun.com/centos-vault/6.10/contrib/$basearch/
gpgcheck=1
enabled=0
gpgkey=http://mirrors.aliyun.com/centos-vault/RPM-GPG-KEY-CentOS-6
```

然后我原以为万事大吉了，开心的使用yum list命令看看这环境里装了哪些依赖，结果又遇到报错: Cannot retrieve repository metadata (repomd.xml) for repository: extras. Please verify its path and try again

百度查了半天通过下面这个网址里提供的解决办法解决了。

https://blog.csdn.net/liqi_q/article/details/83063264