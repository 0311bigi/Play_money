import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 請把下面這行的 my-ledger 換成您在 GitHub 上的「Repository (儲存庫) 名稱」
  base: '/Play_money/',
})