---
layout: post
title:  "完整的gitlab服务搭建"
date:   2019-06-18 15:31:26 +0800
tag:    notes
---

- Git的优点
    - 适合分布式开发，强调个体
    - 公共服务器压力和数据量都不会太大
    - 速度快、灵活
    - 任意两个开发者之间可以很容易的解决冲突
    - 离线可以正常提交代码和工作
- Git缺点
    - 学习周期相对而言比较长
    - 不符合常规思维
    - 代码保密性差，一旦开发者把整个库克隆下来就可以完全公开所有代码和版本信息

- 准备环境
    - Ubuntu18.04 server
    - 搞清楚自己的环境，如果不知道 请输入以下命令:
        ```bash
        root@gitlab:~#  lsb_release -a
        LSB Version:	core-9.20170808ubuntu1-noarch:security-9.20170808ubuntu1-noarch
        Distributor ID:	Ubuntu
        Description:	Ubuntu 18.04.2 LTS
        Release:	18.04
        Codename:	bionic
        root@gitlab:~#
        ```
    - 安装依赖包:
        ```bash
        apt update -y
        apt list --upgradable
        apt install curl openssh-server ca-certificates postfix -y
        ```
        注：执行完成后，出现邮件配置，选择Internet那一项（不带Smarthost的）如下所示：
        
        选择完后，后面的东西，随便填吧，没啥卵用~
- 旧安装方式
    - 利用[清华大学的镜像](https://mirror.tuna.tsinghua.edu.cn/help/gitlab-ce/)来进行主程序的安装
        - 首先信任 GitLab 的 GPG 公钥:
            ```bash
            curl https://packages.gitlab.com/gpg.key 2> /dev/null | sudo apt-key add - &>/dev/null
            ```
        - 使用root用户修改配置文件:
            ```bash
            echo "deb https://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/ubuntu xenial main" >> /etc/apt/sources.list.d/gitlab-ce.list
            ```
    - 安装 gitlab-ce:
        ```bash
        apt update -y
        apt list --upgradable
        # 安装最新版本
        apt install gitlab-ce -y
        # 安装指定版本
        apt install gitlab-ce=12.0.0-ce.0
        # 查看全部版本
        apt-cache madison gitlab-ce
        # 查看当前版本
        gitlab-rake gitlab:env:info
        ```
        注： 有点慢 耐心等吧~ 
- 新安装方式
    - 下载
        ```bash
        wget --content-disposition https://packages.gitlab.com/gitlab/gitlab-ce/packages/ubuntu/bionic/gitlab-ce_12.0.0-ce.0_amd64.deb/download.deb
        ```
    - 安装
        ```bash
        sudo dpkg -i gitlab-ce_12.0.0-ce.0_amd64.deb
        ```
        注： 有点慢 耐心等吧~ 
- 修改配置:
    ```bash
    vim /etc/gitlab/gitlab.rb
    #更改external_url =http://39.108.250.83 (IP换成你本机的IP地址)
    ```
- 启动sshd和postfix服务
    ```bash
    service sshd start
    service postfix start
    ```
- 启动各项服务
    ```bash
    gitlab-ctl reconfigure
    ```
    注：有点慢，可以出去抽根烟溜达一圈~
- 查看安装是否成功
    ```bash
    gitlab-ctl status
    ```
- 登陆地址 ，就是刚才你刚才添加到配置文件的那个地址登陆访问（无需输入端口）：
    - 上来先让你初始化root用户的密码，剩下的就是界面画操作。 
    - 安装到此结束~
    - 注：gitlab在服务器中的默认代码存放的位置是 /var/opt/gitlab/git-data/repositories

- 备份到阿里云oss
    - [测试有权限访问oss](https://help.aliyun.com/document_detail/50452.html)
        ```bash
        wget http://gosspublic.alicdn.com/ossutil/1.6.7/ossutil64
        chmod +x ossutil64
        ./ossutil64 config
        ```
    - 添加以下配置到/etc/gitlab/gitlab.rb
        ```rb
        gitlab_rails['backup_keep_time'] = 604800

        gitlab_rails['backup_upload_connection'] = {
                'provider' => 'aliyun',
                'aliyun_accesskey_id' => 'L******',
                'aliyun_accesskey_secret' => 'p******',
                'aliyun_oss_endpoint' => 'http://oss-cn-shenzhen-internal.aliyuncs.com',
                'aliyun_oss_bucket' => 'kala-gitlab',
                'aliyun_oss_location' => 'shenzhen'
        }
        gitlab_rails['backup_upload_remote_directory'] = 'backup'
        ```
    - 创建定时任务(每日06:30)
        ```
        DFUSECRONPATH=/etc/cron.d/backupgitlab
        echo "SHELL=/bin/sh" > ${DFUSECRONPATH}
        echo "PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin" >> ${DFUSECRONPATH}
        echo "30 6 * * * root /opt/gitlab/bin/gitlab-rake gitlab:backup:create CRON=1" >> ${DFUSECRONPATH}
        ```
- 服务器迁移
    ```bash
    scp -i ./Desktop/qq9107622tmp.pem.pem 1568758874_2019_09_18_12.0.0_gitlab_backup.tar root@39.108.250.83:/var/opt/gitlab/backups/
    chmod 777 /var/opt/gitlab/backups/1568758874_2019_09_18_12.0.0_gitlab_backup.tar
    gitlab-ctl stop unicorn
    gitlab-ctl stop sidekiq
    gitlab-rake gitlab:backup:restore BACKUP=1568758874_2019_09_18_12.0.0
    gitlab-ctl start
    gitlab-ctl reconfigure

    #进入数据库控制台,执行以下SQL
    gitlab-rails dbconsole
    ```
    ```sql
    -- Clear project tokens
    UPDATE projects SET runners_token = null, runners_token_encrypted = null;
    -- Clear group tokens
    UPDATE namespaces SET runners_token = null, runners_token_encrypted = null;
    -- Clear instance tokens
    UPDATE application_settings SET runners_registration_token_encrypted = null;
    -- Clear runner tokens
    UPDATE ci_runners SET token = null, token_encrypted = null;
    ```

- 参考资料:
    - [https://blog.csdn.net/System_out_print_Boy/article/details/82191420](https://blog.csdn.net/System_out_print_Boy/article/details/82191420)
    - [https://blog.csdn.net/ouyang_peng/article/details/77070977](https://blog.csdn.net/ouyang_peng/article/details/77070977)
    - [https://www.jianshu.com/p/bb25ff793000](https://www.jianshu.com/p/bb25ff793000)

- FAQ参考资料:
    - [https://gitlab.com/gitlab-org/gitlab-foss/issues/59623](https://gitlab.com/gitlab-org/gitlab-foss/issues/59623)
    - [https://gitlab.com/gitlab-org/gitlab-foss/blob/075f59b8b8a84e9515aefbc6d3bb7b9583b7b68d/doc/raketasks/backup_restore.md](https://gitlab.com/gitlab-org/gitlab-foss/blob/075f59b8b8a84e9515aefbc6d3bb7b9583b7b68d/doc/raketasks/backup_restore.md)
