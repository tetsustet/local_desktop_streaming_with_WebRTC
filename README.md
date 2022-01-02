# local_desktop_streaming_with_WebRTC
## 必要なパッケージ
django
## インストール方法
pipenvとpyenvをインストール  
pipfileのあるディレクトリに移動  
仮想環境を作成する  
```
$ pipenv install
```
## 実行方法
```
$ pipenv shell
$ python mysite/manage.py runserver
```

## メモ
Firefox以外はhttpだとlocalHostでないとgetUserMediaができないらしい．  
