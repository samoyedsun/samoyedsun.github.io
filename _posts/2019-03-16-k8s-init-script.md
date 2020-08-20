---
layout: post
title:  "EKS node 初始化脚本"
date:   2019-03-16 11:31:26 +0800
tag: note
---

# EKS中的EC2实例上有一个文件用于初始化服务器的
```sh
# 打开文件
cat /var/lib/cloud/scripts/per-instance/00-EKS-config.sh
```
```sh
#!/bin/bash -e

echo "Configuring EKS node via $(readlink -f ${0})"

echo "Aliasing EKS k8s snap commands"
snap alias kubelet-eks.kubelet kubelet
snap alias kubectl-eks.kubectl kubectl

echo "Stopping k8s daemons until configured"
snap stop kubelet-eks
# Flush the restart-rate for failed starts
systemctl reset-failed

REGION=$(ec2metadata --availability-zone | sed 's/[a-z]$//g')
if [ -z "$REGION" ] ; then
    echo "Could not determine region"
    exit 1
fi
echo "region: $REGION"

INSTANCE_ID=$(ec2metadata --instance-id)
if [ -z "$INSTANCE_ID" ] ; then
    echo "Could not determine instance ID"
    exit 1
fi
echo "instance-id: $INSTANCE_ID"

# Get the CloudFormation Stack name from the instance tags
CF_STACK_NAME=$(/snap/bin/aws --output text --region "$REGION" ec2 \
  describe-tags \
    --filters Name=resource-type,Values=instance \
              Name=resource-id,Values="$INSTANCE_ID" \
    --query "Tags[?Key=='aws:cloudformation:stack-name'] | [].Value")

if [ -z "$CF_STACK_NAME" ] ; then
    echo "Could not determine CloudFormation Stack name from instance tags."
    echo "  Key=aws:cloudformation:stack-name, Value=<name>"
    echo "Ensure you have the latest CloudFormation Ubuntu nodegroup template."
    exit 1
fi
echo "CloudFormation stack name: $CF_STACK_NAME"

cf_report_exit() {
    if [ $? = 0 ]; then
        STATUS="SUCCESS"
    else
        STATUS="FAILURE"
    fi
    echo "Reporting $STATUS to CloudFormation"
    /snap/bin/aws --region "$REGION" cloudformation \
        signal-resource \
            --stack-name "$CF_STACK_NAME" \
            --logical-resource-id NodeGroup \
            --unique-id "$INSTANCE_ID" \
            --status "$STATUS"
}

# Report the exit code to CloudFormation
trap cf_report_exit EXIT

# Get the Cluster Name from the instance tags
# The nodegroup CloudFormation template sets a tag containing the cluster name
# Key=kubernetes.io/cluster/$CLUSTER_NAME, Value=owned
CLUSTER_NAME=$(/snap/bin/aws --output text --region "$REGION" ec2 \
  describe-tags \
    --filters Name=resource-type,Values=instance \
              Name=resource-id,Values="$INSTANCE_ID" \
    --query "Tags[?starts_with(Key, 'kubernetes.io/cluster')] | [?Value=='owned'].Key" | \
  sed 's,kubernetes\.io/cluster/,,g')

if [ -z "$CLUSTER_NAME" ] ; then
    echo "Could not determine cluster name.  Did not find instance tag:"
    echo "  Key=kubernetes.io/cluster/<cluster_name>, Value=owned"
    exit 1
fi
echo "cluster name: $CLUSTER_NAME"

# Get the Max # Pods for kubelet config
KUBELET_MAX_PODS=$(/snap/bin/aws --output text --region "$REGION" ec2 \
  describe-tags \
    --filters Name=resource-type,Values=instance \
              Name=resource-id,Values="$INSTANCE_ID" \
    --query "Tags[?Key=='com.ubuntu.cloud:eks:kubelet:max-pods-per-node'].Value")

if [ -z "$KUBELET_MAX_PODS" ] ; then
    echo "Could not determine maximum number of pods to run node"
    echo "  Key=com.ubuntu.cloud:eks:kubelet:max-pods-per-node, Value=<max-pods>"
    echo "Ensure you have the latest CloudFormation Ubuntu nodegroup template."
    exit 1
fi
echo "kubelet max pods per node: $KUBELET_MAX_PODS"

CA_CERTIFICATE_DIRECTORY=/etc/kubernetes/pki
CA_CERTIFICATE_FILE_PATH=$CA_CERTIFICATE_DIRECTORY/ca.crt
mkdir -p $CA_CERTIFICATE_DIRECTORY

echo "Getting the cluster endpoint name and certificate"
/snap/bin/aws eks describe-cluster \
    --region="$REGION" \
    --name="$CLUSTER_NAME" \
    --query 'cluster.{certificateAuthorityData: certificateAuthority.data, endpoint: endpoint}' \
  > /tmp/describe_cluster_result.json

# Store the certificiate
cat /tmp/describe_cluster_result.json | \
    grep certificateAuthorityData | \
    awk '{print $2}' | \
    sed 's/[,\"]//g' | \
    base64 -d >  $CA_CERTIFICATE_FILE_PATH
if [ -z "$(cat $CA_CERTIFICATE_FILE_PATH)" ] ; then
    echo "Cluster certificate data was empty"
    exit 1
fi

MASTER_ENDPOINT=$(cat /tmp/describe_cluster_result.json | \
                  grep endpoint | awk '{print $2}' | sed 's/[,\"]//g')
if [ -z "$MASTER_ENDPOINT" ] ; then
    echo "Could not determine master endpoint"
    exit 1
fi
echo "master endpoint: $MASTER_ENDPOINT"

rm /tmp/describe_cluster_result.json

mkdir -p /var/lib/kubelet
cat > /var/lib/kubelet/kubeconfig <<EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority: $CA_CERTIFICATE_FILE_PATH
    server: $MASTER_ENDPOINT
  name: kubernetes
contexts:
- context:
    cluster: kubernetes
    user: kubelet
  name: kubelet
current-context: kubelet
users:
- name: kubelet
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1alpha1
      command: /usr/bin/heptio-authenticator-aws
      args:
        - "token"
        - "-i"
        - "$CLUSTER_NAME"
EOF

echo "Configuring kubelet snap"
snap set kubelet-eks \
    address=0.0.0.0 \
    authentication-token-webhook=true \
    authorization-mode=Webhook \
    allow-privileged=true \
    cloud-provider=aws \
    cluster-dns=10.100.0.10 \
    cluster-domain=cluster.local \
    cni-bin-dir=/opt/cni/bin \
    cni-conf-dir=/etc/cni/net.d \
    container-runtime=docker \
    max-pods="$KUBELET_MAX_PODS" \
    node-ip="$(ec2metadata --local-ipv4)" \
    network-plugin=cni \
    pod-infra-container-image="602401143452.dkr.ecr.$REGION.amazonaws.com/eks/pause-amd64:3.1" \
    cgroup-driver=cgroupfs \
    register-node=true \
    kubeconfig=/var/lib/kubelet/kubeconfig \
    feature-gates=RotateKubeletServerCertificate=true \
    anonymous-auth=false \
    client-ca-file="$CA_CERTIFICATE_FILE_PATH"

echo "Starting k8s kubelet daemon"
snap start kubelet-eks

```
