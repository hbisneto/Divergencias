# A

cd ~/Desktop/Bisneto/Divergencias/Divergencias

./gradlew clean
./gradlew assembleDebug

```
app/build/outputs/apk/debug/app-debug.apk
```

# B

./platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk
OU
./gradlew installDebug