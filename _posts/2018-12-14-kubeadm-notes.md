---
layout: post
title:  "kubeadm搭建k8s环境笔记"
date:   2018-12-14 19:00:26 +0800
tag: notes
---

### 创建ec2:
---

- step 1:
    - ![](/images/2018-12-14-kubeadm-0.png)
    - 点下一步
- step 2:
    - ![](/images/2018-12-14-kubeadm-1.png)
    - 点下一步
- step 3:
    - ![](/images/2018-12-14-kubeadm-2.png)
    - 点下一步
- step 4:
    - ![](/images/2018-12-14-kubeadm-3.png)
    - 点下一步
- step 5:
    - 设定磁盘大小，默认就好, 然后下一步.
    - 不需要添加标签，同样默认就好，然后下一步.
- step 6:
    - ![](/images/2018-12-14-kubeadm-4.png)
    - 点下一步
- step 7:
    - ![](/images/2018-12-14-kubeadm-5.png)

创建的实例信息, 如果是集群的话需要检查一下这台机器的sudo cat /sys/class/dmi/id/product_uuid是否跟其他机器的重复，uuid与mac地址会确保节点的唯一性
```
k8s1  18.136.212.18   172.31.21.194		EC294478-3F08-60EA-1034-6AADE95A2A8F
```

### 登陆ec2安装kubernetes套件:
---

按照官方文档 repo_gpgcheck=1，这里需要改为0，不然会提示repo key不对导致无法安装; 这个已经有人提issue,官方并没有回复
![](/images/2018-12-14-kubeadm-6.png)

```
# 加入kubernetes套件yum仓库
> cat <<EOF > kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=0
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
exclude=kube*
EOF
> sudo mv kubernetes.repo /etc/yum.repos.d/

# Set SELinux in permissive mode (effectively disabling it)
> setenforce 0
> sudo sed -i 's/^SELINUX=disable$/SELINUX=permissive/' /etc/selinux/config

# 查找kubectl kubelet kubeadm
> sudo yum search kubelet kubeadm kubectl --disableexcludes=kubernetes

# 安装kubectl kubelet kubeadm
> sudo yum install -y kubelet kubeadm kubectl --disableexcludes=kubernetes

# 设置kubelet服务开启自启动，并启动它(然后它会每隔几秒重启一次等待kubeadm init告诉它做什么)
> sudo systemctl enable kubelet && sudo systemctl start kubelet
```

```
> cat <<EOF > k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
> sudo mv k8s.conf /etc/sysctl.d/
> sudo sysctl --system

# 安装docker, 并启动docker服务, 设置开启自启动
> sudo amazon-linux-extras install docker -y
> sudo systemctl start docker
> sudo systemctl enable docker

# 安装tc (解决`sudo kubeadm init`时[WARNING FileExisting-tc]: tc not found in system path)
> sudo yum install tc -y

# 如果插件将容器连接到Linux桥，插件必须将net/bridge/bridge-nf-call-iptables sysctl设置为1，以确保iptables代理函数正确
> sudo sysctl net.bridge.bridge-nf-call-iptables=1
```

### 通过kubeadm快速启动kubernetes
---

```
# 初始化kubeadm，并指定master地址
> sudo kubeadm init --apiserver-advertise-address 172.31.21.194 --pod-network-cidr=192.168.0.0/16

... 此处省略n行输出

Your Kubernetes master has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

You can now join any number of machines by running the following on each node
as root:

  kubeadm join 172.31.21.194:6443 --token ss35db.wh9u65dtdm7yh5ao --discovery-token-ca-cert-hash sha256:1231548d356bd66c248c050aba7fdb197ff60c69328cffca2066e35badd82dbf
```

```
# 配置kubectl
> mkdir -p $HOME/.kube
> sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
> sudo chown $(id -u):$(id -g) $HOME/.kube/config

# 加入网络插件，不然core-dns启动不起来, node也会一直停留在NoReady状态
> kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/bc79dd1505b0c8681ece4de4c0d86c5cd2643275/Documentation/kube-flannel.yml

# 默认情况下，出于安全原因，您的群集不会在主服务器上安排容器。如果您希望能够在主服务器上安排pod，例如，对于用于开发的单机Kubernetes集群，请运行：
> kubectl taint nodes --all node-role.kubernetes.io/master-
node/ip-172-31-21-194.ap-southeast-1.compute.internal untainted

# 以下命令需要在工作节点执行，而非master上执行, 意思是将本节点与master建立关系，加入到集群。
> kubeadm join 172.31.21.194:6443 --token ss35db.wh9u65dtdm7yh5ao --discovery-token-ca-cert-hash sha256:1231548d356bd66c248c050aba7fdb197ff60c69328cffca2066e35badd82dbf
# 如果要增加工作节点需要先完成上面的 创建ec2, 登陆ec2安装kubernetes套件 两大步骤, 然后执行以上命令即可

# 安装kubernetes-dashboard
> kubectl apply -f https://raw.githubusercontent.com/rickgong/k8s/master/kubernetes/kubernetes-dashboard.yaml
> kubectl describe svc kubernetes-dashboard --namespace=kube-system
```

BTW:

##### 如果你的镜像存在aws上或其他地方的私有镜像仓库需要做以下步骤，否则部署时镜像拉取不下来
- 使用以下命令获取登陆私有镜像仓库的相关认证信息
    ```shell
    export AWS_ACCESS_KEY_ID=AKIAJTTTL4H6JIQXXXXX
    export AWS_SECRET_ACCESS_KEY=7Xgy6KLUQSh31zXDe048vuFRfL6wpOZZXXXXX
    aws ecr get-login --no-include-email --region ap-southeast-1
    ```
- 通过以下命令创建一个docker-registry类型的secret
    ```shell
    kubectl -n bidogo-dev create secret docker-registry registry-key \
        --docker-server=https://xxxxxxx.dkr.ecr.ap-southeast-1.amazonaws.com \
        --docker-username=AWS \
        --docker-password=xxxxxx \
        --docker-email=xxx@xxxxx.com
    ```
- 在编排文件中指定拉取docker镜像时的验证信息（上面创建的secret）
    - ![](/images/2018-12-14-kubeadm-8.png)

## 至此基于ec2使用kubeadm搭建kubernetes环境完成!

## FAQ:

##### 执行 kubeadm join 时如果发现以下输出说明token过期（有效期12小时）,需要重新创建token.
```
[join] Reading configuration from the cluster...
[join] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -oyaml'
unable to fetch the kubeadm-config ConfigMap: failed to get config map: Unauthorized
```

##### 更换新的token重新执行才会成功
```
[ec2-user@ip-172-31-21-194 ~]$ kubeadm token list
TOKEN                     TTL         EXPIRES                USAGES                   DESCRIPTION                                                EXTRA GROUPS
ss35db.wh9u65dtdm7yh5ao   <invalid>   2018-12-15T08:34:21Z   authentication,signing   The default bootstrap token generated by 'kubeadm init'.   system:bootstrappers:kubeadm:default-node-token
[ec2-user@ip-172-31-21-194 ~]$ kubeadm  token create
qpl6a2.8941lhcnp93bswdd
[ec2-user@ip-172-31-21-194 ~]$ kubeadm token list
TOKEN                     TTL         EXPIRES                USAGES                   DESCRIPTION                                                EXTRA GROUPS
qpl6a2.8941lhcnp93bswdd   23h         2018-12-18T04:17:30Z   authentication,signing   <none>                                                     system:bootstrappers:kubeadm:default-node-token
ss35db.wh9u65dtdm7yh5ao   <invalid>   2018-12-15T08:34:21Z   authentication,signing   The default bootstrap token generated by 'kubeadm init'.   system:bootstrappers:kubeadm:default-node-token
```

nslookup kubernetes.default
