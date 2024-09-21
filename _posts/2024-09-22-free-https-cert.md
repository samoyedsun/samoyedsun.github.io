---
layout: post
title:  免费https证书使用
date:   2024-08-30 11:48:00 +0800
tag:    notes
---

首先将my.domain.com域名解析到服务器IP

安装acme
```bash
curl  https://get.acme.sh | sh
echo "alias acme.sh=~/.acme.sh/acme.sh" >> .profile
source .profile
```

安装nginx
```bash
apt install nginx
```

修改/etc/nginx/sites-available/default域名配置那里为自己的域名
```conf
server_name my.domain.com;
```

重新加载nginx配置
```bash
systemctl reload nginx
```

生成证书
```bash
acme.sh --issue -d my.domain.com --nginx
```

创建证书硬链接（软链接nginx会报错找不到文件）
```bash
ln .acme.sh/my.domain.com_ecc/fullchain.cer /etc/nginx/cert/my.domain.com.cer
ln .acme.sh/my.domain.com_ecc/my.domain.com.key /etc/nginx/cert/my.domain.com.key
```

配置htts /etc/nginx/sites-available/default
```conf
server {
	listen       443 ssl;
	listen 	[::]:443 ssl;
	server_name  my.domain.com;

	ssl_certificate /etc/nginx/cert/my.domain.com.cer;
	ssl_certificate_key /etc/nginx/cert/my.domain.com.key;

	root /var/www/html;

	# Add index.php to the list if you are using PHP
	index index.html index.htm index.nginx-debian.html;

	server_name my.domain.com;

	location / {
		# First attempt to serve request as file, then
		# as directory, then fall back to displaying a 404.
		try_files $uri $uri/ =404;
	}
}

server {
	listen 80 default_server;
	listen [::]:80 default_server;

	root /var/www/html;

	# Add index.php to the list if you are using PHP
	index index.html index.htm index.nginx-debian.html;

	server_name my.domain.com;

	location / {
		# First attempt to serve request as file, then
		# as directory, then fall back to displaying a 404.
		try_files $uri $uri/ =404;
	}
}

```

最后重新加载nginx配置
```bash
systemctl reload nginx
```

至此结束，可以通过https访问你的网站了。
