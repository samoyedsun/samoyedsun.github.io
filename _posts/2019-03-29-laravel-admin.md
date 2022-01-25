---
layout: post
title:  "1分钟创建一个管理后台"
date:   2019-03-29 15:31:26 +0800
tag:    notes
---

- 废话不多说，上命令!
```sh
# 安装laravel
composer create-project --prefer-dist laravel/laravel backstage
cd backstage
# 打开.env，修改数据库连接相关配置，然后执行以下命令
composer require encore/laravel-admin
php artisan vendor:publish --provider="Encore\Admin\AdminServiceProvider"
php artisan admin:install
php artisan serve --host=0.0.0.0 --port=8080
# 后台运行
nohup php artisan serve --host=0.0.0.0 --port=8080 > test.log &1 &
```

- 增加功能
```sh
# 生成数据模型并生成数据库迁移
php artisan make:model GameRooms --migration
# 或单独生成数据库迁移
php artisan make:migration create_game_rooms_table
# 运行所有未完成的迁移
php artisan migrate
# 创建对应App\GameRooms模型的控制器
php artisan admin:make GameRoomsController --model=App\\GameRooms
# 在laravel-admin的路由配置文件app/Admin/routes.php里添加一行:
$router->resource('game/rooms', GameRoomsController::class);
# 该命令会回滚并重新运行所有迁移
php artisan migrate:refresh
# 重新生成Composer的自动加载器
composer dump-autoload
# 填充数据
php artisan db:seed
# 由框架生成一个Seeder
php artisan make:seeder UsersTableSeeder
```

- 简洁操作
```
php artisan make:model InviteCodes
php artisan admin:make InviteCodesController --model=App\\InviteCodes
```
