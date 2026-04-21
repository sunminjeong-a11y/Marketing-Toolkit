import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // (사용 중인 플러그인에 따라 다름)

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "l6lvn3-5173.csb.app", // 에러 메시지에 나온 호스트 주소를 문자열로 추가
    ],
  },
});
