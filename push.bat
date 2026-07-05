@echo off
echo 正在執行專案建置...
call npm run build
echo 正在準備上傳至 GitHub...
git add .
set /p msg="請輸入本次更新訊息 (Commit message): "
git commit -m "%msg%"
git push origin main
echo 上傳完成！
pause