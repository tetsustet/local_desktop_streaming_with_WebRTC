# local_desktop_streaming_with_WebRTC
## 必要なパッケージ
* django = "4.0"
* djangorestframework = "3.13"
## インストール方法
pipenvとpyenvをインストール  
pipfileのあるディレクトリに移動  
仮想環境を作成する  
```
$ cd ~~
$ pipenv install
```
## 実行方法
### データベースを準備する
```
$ python manage.py migrate
```
### Djangoのサーバーを立ち上げる
```
$ pipenv shell
$ python mysite/manage.py runserver
```
### 配信者
http://localhost:8000/desktop-streaming/create-room/ にアクセス
![create room img](/img/create_room.png)<br>
部屋idを入力して作成をクリックする．
### 視聴者
http://localhost:8000/desktop-streaming/ にアクセス
![join img](/img/join.png)<br>
参加したい部屋idを入力して参加する．
### 画面共有する
画面を共有をクリック  
![click share desktop button](/img/share1.png)<br>
共有する画面を選択し，共有をクリック  
![choose  desktop and click share button](/img/share2.png)<br>
共有が開始される  
![sharing desktop begin](/img/share3.png)<br>
共有を停止する場合は赤い共有を停止ボタンをクリック
![push red button to stop desktop begin](/img/share4.png)<br>
![a after stop sharing screen shot ](/img/share5.png)<br>

## メモ
* httpではnavigator.mediaDeviccesはlocalhost以外undefinedになり，画面共有をすることができない．
