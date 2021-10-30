- 开发命令:
    ```shell
    sudo gem install jekyll bundler
    if ["you don‘t have one"]; then
        jekyll new blog
        cd blog
    fi
    sudo bundle install
    bundle exec jekyll build
    bundle exec jekyll server
    ```

- ssh代理github
    ```shell
    # cat $HOME/.ssh/config
    ServerAliveInterval 1

    Host github.com
        HostName github.com
        IdentityFile ~/.ssh/id_rsa
        User git
        Port 22
        ProxyCommand nc -v -x 127.0.0.1:1086 %h %p
    ```

- git使用socket5代理
    ```
    cat ~/.gitconfig

    # 设置ss
    git config --global http.proxy 'socks5://127.0.0.1:1080'
    git config --global https.proxy 'socks5://127.0.0.1:1080'
    # 设置代理
    git config --global http.proxy http://127.0.0.1:1080
    git config --global https.proxy https://127.0.0.1:1080
    # 取消代理
    git config --global --unset http.proxy
    git config --global --unset https.proxy
    ```
