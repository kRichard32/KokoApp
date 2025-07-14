`npm install`

`npx expo run:android`

Go to `android/app/build.gradle` inside of your RN project and add this bit of code inside of `android.defaultConfig`:

```
externalNativeBuild {
    cmake {
        arguments "-DCMAKE_MAKE_PROGRAM=C:\\ninja\\ninja.exe", "-DCMAKE_OBJECT_PATH_MAX=1024"
    }
}
```

`npx react-native doctor` if anything goes wrong 
