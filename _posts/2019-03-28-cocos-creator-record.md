---
layout: post
title:  "CocosCreator调用安卓接口实现录音"
date:   2019-03-28 11:39:26 +0800
tag: code
---

在我使用CocosCreator打包安卓应用程序的时候，会有一些安卓平台依赖的文件从CocosCreator引擎中拷贝到项目目录，然后编译的时候会将一些在安卓平台用到的代码一起编译到应用程序中，比如下面就有几个文件:

- SDKWrapper.java
    - FROM: /Applications/CocosCreator.app/Contents/Resources/cocos2d-x/extensions/anysdk/platform/android/src/org/cocos2dx/javascript/SDKWrapper.java
    - TO: /Users/mazhao/baccarat-client/build/jsb-link/frameworks/runtime-src/proj.android-studio/app/src/org/cocos2dx/javascript/SDKWrapper.java

- AppActivity.java
    - FROM: /Applications/CocosCreator.app/Contents/Resources/cocos2d-x/templates/js-template-link/frameworks/runtime-src/proj.android-studio/app/src/org/cocos2dx/javascript/AppActivity.java
    - TO: /Users/mazhao/baccarat-client/build/jsb-link/frameworks/runtime-src/proj.android-studio/app/src/org/cocos2dx/javascript/AppActivity.java

- AndroidManifest.xml
    - FROM: /Applications/CocosCreator.app/Contents/Resources/cocos2d-x/templates/js-template-link/frameworks/runtime-src/proj.android-studio/app/AndroidManifest.xml
    - TO: /Users/mazhao/baccarat-client/build/jsb-link/frameworks/runtime-src/proj.android-studio/app/AndroidManifest.xml

- build.gradle
    - FROM: /Applications/CocosCreator.app/Contents/Resources/cocos2d-x/templates/js-template-link/frameworks/runtime-src/proj.android-studio/app/build.gradle
    - TO: /Users/mazhao/baccarat-client/build/jsb-link/frameworks/runtime-src/proj.android-studio/app/build.gradle

- cocos-project-template.json
    - FROM: /Applications/CocosCreator.app/Contents/Resources/cocos2d-x/templates/js-template-link/cocos-project-template.json
    - TO: /Users/mazhao/baccarat-client/build/jsb-link/cocos-project-template.json

然后我在【/Users/mazhao/baccarat-client/build/jsb-link/frameworks/runtime-src/proj.android-studio/app/src/org/cocos2dx/javascript/】这个目录下加入一个叫RecordAndPlayHelper.java的类，内部提供一套操作语音的静态方法供js使用jsb调用; 前提需要安装Api Level是25的SDK, 修改【/Users/mazhao/baccarat-client/build/jsb-link/frameworks/runtime-src/proj.android-studio/app/build.gradle】中compileSdkVersion字段的值为25，在dependencies字典中加入一行 compile 'com.android.support:support-v4:25.3.1' 因为我们的语音类中有功能需要等级25的SDK支持才能使用; 然后在【/Users/mazhao/baccarat-client/build/jsb-link/frameworks/runtime-src/proj.android-studio/app/AndroidManifest.xml】中加入两个用户权限 "android.permission.RECORD_AUDIO", "android.permission.MODIFY_AUDIO_SETTINGS", 提醒用户给程序授权可以使用语音。好吧，下面是RecordAndPlayHelper.java类的源码:
``` java
//
// Source code recreated from a .class file by IntelliJ IDEA // (powered by Fernflower decompiler)
//

package org.cocos2dx.javascript;

import android.app.Activity;
import android.content.Context;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.media.MediaPlayer.OnCompletionListener;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.widget.Toast;
import java.io.File;
import java.io.IOException;

public class RecordAndPlayHelper {
    private static MediaRecorder mRecorder = null;
    private static MediaPlayer mediaPlayer = null;
    private static boolean isRecording = false;
    public RecordAndPlayHelper() { }
    public static void stopPlayVoice() {
        Log.e("RecordAndPlayHelper", "stopPlayVoice");
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }
    public static int playVoice(String filePath) {
        Log.e("RecordAndPlayHelper", "playVoice:" + filePath);
        if ((new File(filePath)).exists()) {
            AudioManager audioManager = (AudioManager)AppActivity.getContext()
                    .getSystemService(Context.AUDIO_SERVICE);
            audioManager.setMode(audioManager.MODE_NORMAL);
            audioManager.setSpeakerphoneOn(true);
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioStreamType(audioManager.STREAM_MUSIC);
            try {
                mediaPlayer.setDataSource(filePath);
                mediaPlayer.prepare();
                mediaPlayer.setOnCompletionListener(
                        new OnCompletionListener() {
                            public void onCompletion(MediaPlayer mp) {
                                RecordAndPlayHelper.stopPlayVoice();
                            }
                        });
                mediaPlayer.start();
            } catch (Exception var3) {
                var3.printStackTrace();
            }
            return audioManager.getStreamVolume(audioManager.STREAM_MUSIC);
        }
        return 0;
    }
    public static boolean startRecord(String filepath) {
        if (checkRecordPermision()) {
            realRecord(filepath);
            return true;
        } else {
            return false;
        }
    }
    public static void realRecord(String filepath) {
        Log.e("RecordAndPlayHelper", "startRecord");
        Log.e("RecordAndPlayHelper", filepath);
        try {
            if (mRecorder != null) {
                mRecorder.release();
                mRecorder = null;
            }
            mRecorder = new MediaRecorder();
            mRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            mRecorder.setOutputFormat(MediaRecorder.OutputFormat.AMR_NB);
            mRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);
            mRecorder.setAudioChannels(2);
            mRecorder.setAudioSamplingRate(44100);
            mRecorder.setAudioEncodingBitRate(96000);
            mRecorder.setOutputFile(filepath);
            mRecorder.prepare();
            isRecording = true;
            mRecorder.start();
        } catch (IOException var2) {
            Log.e("RecordAndPlayHelper", var2.toString());
        }
    }
    public static boolean checkRecordPermision() {
        if (ContextCompat.checkSelfPermission(AppActivity.getContext(),
                "android.permission.RECORD_AUDIO") != 0) {
            if (ActivityCompat.shouldShowRequestPermissionRationale(
                    (Activity)AppActivity.getContext(),
                    "android.permission.RECORD_AUDIO")) {
                ((AppActivity)AppActivity.getContext()).runOnUiThread(
                        new Runnable() {
                            public void run() {
                                Toast.makeText(AppActivity.getContext(),
                                        "您已禁⽌止该权限，需要重新开启。",
                                        Toast.LENGTH_SHORT).show();
                            }
                        });
            } else {
                ((AppActivity)AppActivity.getContext()).runOnUiThread(
                        new Runnable() {
                            public void run() {
                                ActivityCompat.requestPermissions(
                                        (Activity)AppActivity.getContext(),
                                        new String[]{"android.permission.RECORD_AUDIO"},
                                        100);
                            }
                        });
            }
            Log.e("RecordAndPlayHelper", "checkRecordPermision false");
            return false;
        } else {
            Log.e("RecordAndPlayHelper", "checkRecordPermision true");
            return true;
        }
    }
    public static int getDB() {
        Log.e("RecordAndPlayHelper", "getDB");
        return mRecorder != null ? (int)((double)mRecorder.getMaxAmplitude() * 20.0D / 32767.0D) : -1;
    }
    public static void stopRecord() {
        Log.e("RecordAndPlayHelper", "stopRecord");
        if (mRecorder != null) {
            try {
                isRecording = false;
                mRecorder.stop();
                mRecorder.reset();
                mRecorder.release();
                mRecorder = null;
            } catch (RuntimeException var1) {
                isRecording = false;
                mRecorder.reset();
                mRecorder.release();
                mRecorder = null;
            }
        }
    }
    public static String getSdCardFile() {
        return AppActivity.getContext().getExternalCacheDir().getAbsolutePath();
    }
}
```

其实上面这一系列操作都做成一个扩展包来完成的，以后会做进一步流程的优化。


通过以下方式在cocos creator项目代码中去使用上面定义的静态方法:
```javascript
{
    //获取缓存目录的绝对路径
    getCacheDirAbsolute: function (filePath) {
        var className = 'org/cocos2dx/javascript/RecordAndPlayHelper';
        var mathodName = 'getSdCardFile';
        var mathodSignature = '()Ljava/lang/String;';
        return jsb.reflection.callStaticMethod(className, mathodName, mathodSignature);
    },
    //开始录音
    startRecord: function (filePath) {
        var className = 'org/cocos2dx/javascript/RecordAndPlayHelper';
        var mathodName = 'startRecord';
        var mathodSignature = '(Ljava/lang/String;)Z';
        var param = filePath;
        return jsb.reflection.callStaticMethod(className, mathodName, mathodSignature, param);
    },
    //停止录音
    stopRecord: function () {
        var className = 'org/cocos2dx/javascript/RecordAndPlayHelper';
        var mathodName = 'stopRecord';
        var mathodSignature = '()V';
        return jsb.reflection.callStaticMethod(className, mathodName, mathodSignature);
    }
    //播放语音
    playVoice: function (filePath) {
        let className = 'org/cocos2dx/javascript/RecordAndPlayHelper';
        let mathodName = 'playVoice';
        let mathodSignature = '(Ljava/lang/String;)I';
        let param = filePath;
        return jsb.reflection.callStaticMethod(className, mathodName, mathodSignature, param);
    },
}
```

#### Android app版本号的修改:
```txt 
再app的build.gradle中

android {
    compileSdkVersion 24
    buildToolsVersion "24.0.3"
    defaultConfig {
        applicationId "com.orbbec.obcolor"
        minSdkVersion 15
        targetSdkVersion 22
        versionCode 2
        versionName "2.0.1"  ---》在这里修改对应的版本号即可。
        testInstrumentationRunner "android.support.test.runner.AndroidJUnitRunner"
    }
```
