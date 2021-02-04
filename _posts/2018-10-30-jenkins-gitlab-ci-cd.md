---
layout: post
title:  "jenkins/gitlab实现ci/cd笔记"
date:   2018-10-30 17:36:26 +0800
tag: code
---

- 首先我开了一台centos7系统的ECS实例, 安装并启动docker服务, 创建存放kubectl,aws,ssh配置的目录
    ``` shell
    sudo yum install docker -y
    sudo systemctl start docker
    mkdir .kube
    mkdir .aws
    mkdir .ssh  #将gitlab中jenkins用户的私钥配置在本目录，命名为：id_rsa
    ```
- 在你拥有kubernetes操作权限的主机（其实就是我自己本地的主机）上执行以下命令将kubectl,aws的配置上传到ECS实例，用于容器内部署kubernetes
    ``` shell
    ******@iMac-3:~/Dockerfile/jenkins$ scp ~/.aws/config ec2-user@ec2-host:/home/ec2-user/.aws
    config             100%   43     0.2KB/s   00:00
    ******@iMac-3:~/Dockerfile/jenkins$ scp ~/.aws/credentials ec2-user@ec2-host:/home/ec2-user/.aws/
    credentials        100%  116     0.5KB/s   00:00
    ******@iMac-3:~/Dockerfile/jenkins$ scp ~/.kube/config ec2-user@ec2-host:/home/ec2-user/.kube/
    config             100% 2027     8.3KB/s   00:00
    ```
- 在宿主机登陆aws镜像仓库
    ``` shell
    aws ecr get-login --no-include-email --region us-east-1 | sudo bash
    ```
    - 下面Jenkinsfile中需要加上 [aws ecr get-login --no-include-email --region us-east-1] 获取的docker登陆命令，这样才能在容器中登陆
- 如果宿主机没有aws命令，可以执行以下命令安装
    ``` shell
    sudo yum install python
    easy_install pip
    pip install tornado
    pip install nose
    pip install awscli --ignore-installed six
    ```
- 使用samoyedsun/blueocean镜像启动jenkins服务容器
    - 在容器中默认用root用户执行程序; jenkins默认是在jenkins用户环境下运行的，执行脚本的时候会有很多限制
    - 当容器退出时会自动删除；我喜欢这个功能, 容器退出了基本就没用了，通常都要手动删的
    - 以daemon方式运行jenkins容器
    - 映射容器开放的8080端口到宿主机; 用于我们通过宿主机ip访问本容器服务
    - 映射容器的50000端口到宿主机; 配置jenkins集群会用到，我并没有用，可以去掉
    - 挂载容器中的jenkins程序主目录到宿主机; 避免容器退出后数据会丢失导致还要重新设置jenkins; 这里没有用绝对路径，默认会指定/var/lib/docker/volumes为绝对路径
        ``` shell
        > sudo ls /var/lib/docker/volumes
        jenkins-data  metadata.db
        ```
    - 挂载宿主机容器服务本地socket到容器中; 用于制作docker镜像时在容器中执行docker命令操作宿主机docker服务
    - 挂载拥有gitlab仓库权限的用户的私有key到容器中; 用于在容器中拉取仓库代码
    - 挂载kubetl配置到容器中；用于操作eks
    - 挂载aws配置到容器中；用于kubectl操作eks
    - 为容器起个容易记的名字, 否则会随机起名字; blueocean是一个让jenkins更漂亮的插件，而这个镜像自带blueocean插件，以后这个插件会合并到jenkins
    ``` shell
    sudo docker run \
        -u root \
        --rm \
        -d \
        -p 8080:8080 \
        -p 50000:50000 \
        -v $HOME/jenkins-data:/var/jenkins_home \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v $HOME/.ssh/id_rsa:/root/.ssh/id_rsa \
        -v $HOME/.kube/config:/root/.kube/config \
        -v $HOME/.aws/credentials:/root/.aws/credentials \
        -v $HOME/.aws/config:/root/.aws/config \
        -v /usr/share/zoneinfo/Asia/Shanghai:/etc/localtime \
        --name jenkins samoyedsun/blueocean
    ```
- 可以通过两种方式拿到密码，这个密码只使用一次
    ``` shell
    [ec2-user@ip-192-168-237-111 ~]$ sudo docker exec -it jenkins cat /var/jenkins_home/secrets/initialAdminPassword
    dd8464a1d0b448bcaf5e1b134c359585
    [ec2-user@ip-192-168-237-111 ~]$ sudo cat $HOME/jenkins-data/secrets/initialAdminPassword
    dd8464a1d0b448bcaf5e1b134c359585
    ```
- 打开 http:主机ip:8080 输入密码后,点击安装推荐的插件；设置admin账户信息, 然后会让你输入本服务器的网址，用默认的就好，以后在配置中可以改；改的话也是在我们为指定服务器指定域名的时候或者增加代理服务器指定新的网关的时候改
    ![](/images/2018-10-30-jenkins-0.png)
- 第一次会自动登陆，然后会看到以下画面
    ![](/images/2018-10-30-jenkins-1.png)
- 我英文垃圾，先装个中文插件压压惊; 【Manage Jenkins】->【Plugin Manager】->【Available】,在Filter:中输入Locale搜索这个插件,勾选,->【Install without restart】->【Go back to the top page】->【Manage Jenkins】->【Configure System】->【configuration】->【Locale】,在Default Language中输入zh_CN（这里还有很多语言，比如：en_US等都是国际化标志）-> 勾选[Ignore browser preference and force this language to all users] ->【Save】,然后界面就成中文的了.
- 然后按照上面安装Locale插件的流程安装一下GitLab插件；用于提供gitlab事件通知jenkins的接口.
- 首先我会去配置拥有gitlab仓库的jenkins用户权限的密钥,这样才有权限拉取仓库代码;【凭据】->【系统】->【全局凭据】->【添加凭据】，类型我选择[SSH Username with private key],范围我选择[全局],Username我填Jenkins,Private Key我选择Enter directly，然后我输入了我的私钥（也就是前面那个.ssh/id_rsa的内容），->【确定】
    ![](/images/2018-10-30-jenkins-2.png)
- 创建我们的第一个流水线; 【新建任务】-> (输入一个任务名:dev-bid-on-kubernetes) ->【流水线】->【确定】->勾选[Build when a change is pushed to GitLab. GitLab webhook URL: http://主机ip:8080/project/dev-bid-on-kubernetes]->【高级】->勾选[Filter branches by regex] -> (在Source Branch Regex中填写^mirror-image-dev$这个正则表达式, 由于仓库每次有提交都会触发push事件，我这里是对跟本流水线无关的的分支提交事件做一个屏蔽）->【Generate】(Secret token会在配置gitlab时用到，对数据传输做一个加密)-> (在流水线定义处选择Pipeline script from SCM) —> (SCM选择Git) -> (Repository URL输入我的gitlab仓库地址:git@gitlab.ddpkcc.com:kubernetes/kubernetes-bid.git) -> (Credentials选择我刚刚配置的ssh凭证) -> (Branch Specifier填写我的镜像分支名:origin/mirror-image-dev，分支顶层目录要包含Jenkinsfile文件，因为流水线是通过Jenkinsfile里的代码一个阶段一个阶段的执行的) -> 【保存】, 然后【立即构建】测试下流程有没有问题.
    ![](/images/2018-10-30-jenkins-3.png)
- 奥，我们的gitlab push事件自动触发还没生效。ok，我配置一下
    ![](/images/2018-10-30-jenkins-4.png)

- 我的Jenkinsfile大致是一个这样的结构,仅供参考; 也可以在其中加入test阶段,或者你需要的其他阶段; 也可以用其他语言来编写这个文件，python,node之类的...
    ```Jenkinsfile
    node {

        stage("reset env") {
        sh '''
            whoami
        pwd
        ls -al

            rm -rf ./*
        '''
        }

        stage("fetch code") {
        sh '''
            if [ -n `which git` ]
            then
                    git --version
            else
                    echo "没安装git"
            fi
        '''
        }

        stage("build images") {
        sh '''
            if [ -n `which docker` ]
            then
                    docker ps -a
                    docker images
            else
                    echo "没安装docker"
            fi
        '''
        }

        stage("deploy kubernetes") {
        sh '''
            if [ -n `which kubectl` ]
            then
                    kubectl get pods -o wide --all-namespaces
            else
                    echo "没安装kubectl"
            fi
        '''
        }

        stage("notify dingding") {
        sh '''
                    echo "通知钉钉{开发服}{vx.x.x}版本部署ok！"
        '''
        }

    }
    ```


# BTW:

### CI, CD AND CD:
- 持续集成(Continuous Integration, CI):
    - 代码合并，构建，部署，测试都在一起。持续执行这个过程。
    - 目的是快速发现问题，避免上线后的风险。
- 持续部署(Continuous Integration, CD):
    - 部署到测试环境，预生产环境，生产环境。
- 持续交付(Continuous Delivery, CD):
    - 将最终产品发布到生产环境，给用户使用。
- 目的:
    - 自动化.
    - 减少人工干预，减少故障.
    - 提高产品整体的交付效率.

### centos下安装jenkins:

    ``` shell
    docker run -d -p 8080:8080 -p 50000:50000 -it --privileged --name centos centos /usr/sbin/init
    yum install wget vim initscripts java docker -y
    easy_install pip
    pip install tornado
    pip install nose
    pip install awscli --ignore-installed six
    wget https://github.com/kubernetes-sigs/aws-iam-authenticator/releases/download/v0.3.0/heptio-authenticator-aws_0.3.0_linux_amd64 -O /usr/bin/heptio-authenticator-aws
    wget https://amazon-eks.s3-us-west-2.amazonaws.com/1.10.3/2018-07-26/bin/linux/amd64/kubectl -O /usr/bin/kubectl
    chmod +x /usr/bin/heptio-authenticator-aws
    chmod +x /usr/bin/kubectl
    sed -i -E 's#overlay2#devicemapper#g' /etc/sysconfig/docker-storage-setup
    sed -i -E 's#overlay2#devicemapper#g' /etc/sysconfig/docker-storage
    wget https://pkg.jenkins.io/redhat-stable/jenkins-2.138.1-1.1.noarch.rpm
    rpm -ivh jenkins-2.138.1-1.1.noarch.rpm
    rm jenkins-2.138.1-1.1.noarch.rpm
    sed -i -E 's#JENKINS_USER="jenkins"#JENKINS_USER="root"#g' /etc/sysconfig/jenkins


    systemctl start jenkins
    systemctl start docker

    docker run -d -p 8081:8080 -p 50001:50000 -it --privileged --name jenkins samoyedsun/jenkins /usr/sbin/init
    # 接下来就是访问网址 http://url:8080 
    ```
