import axios from 'axios'
import router from '@/router'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: '/api/user',
  timeout: 8000
})

instance.interceptors.request.use(cfg => {
  //const rawToken = localStorage.getItem('token');
  const rawToken = sessionStorage.getItem('token');
  
  // 新增：Token有效性检查
  if (rawToken) {
    // 关键修复：去除首尾空格
    const token = rawToken.trim(); 
    
    // 新增：Token格式验证
    if (!isValidTokenFormat(token)) {
      console.error("无效的Token格式:", token);
      // 清除损坏的Token
      sessionStorage.removeItem('token');
      // localStorage.removeItem('token'); 
    } else {
      cfg.headers.Authorization = `Bearer ${token}`;
      
      // 调试日志（开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.debug("发送Token:", token.substring(0, 10) + "...");
      }
    }
  }
  return cfg;
})
function isValidTokenFormat(token) {
  // JWT标准：三段式结构
  return typeof token === 'string' && 
         token.split('.').length === 3;
}

instance.interceptors.response.use(
res => {
    // 登录成功自动处理
    if (res.config.url.includes('/auth/login') && res.data.code === 200) {
      // 关键修复：确保获取的是字符串
      const token = String(res.data.data).trim(); 
      
      if (!isValidTokenFormat(token)) {
        console.error("登录返回的Token格式无效:", token);
        ElMessage.error('登录凭证异常，请重试');
      } else {
        sessionStorage.setItem('token', token);
        // localStorage.setItem('token', token);
        console.info("Token存储成功:", token.substring(0, 10) + "...");
        ElMessage.success('登录成功');
      }
    }
    
    // 统一检查业务状态码
    if (res.data.code !== 200) {
      const errorMsg = res.data.msg || '操作失败';
      ElMessage.error(errorMsg);  // 显示错误消息
      return Promise.reject({
        code: res.data.code,
        msg: errorMsg,
        data: null
      });
    }
    
    return res.data;
  },
  err => {
    console.error("请求失败详情:", err);

    const { response } = err;
    let errorMsg = '请求处理失败，请稍后重试';
    
    // 提取错误信息
    if (response?.data?.msg) {
      errorMsg = response.data.msg;
    } else if (err.message) {
      errorMsg = err.message; // 新增：获取原生错误消息
    } else if (response?.statusText) {
      errorMsg = response.statusText;
    }
    
    // 根据状态码细化错误
    if (response?.status === 401) {
      errorMsg = '登录已过期，请重新登录';
      // 精准清除认证数据
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userInfo');
      // localStorage.removeItem('token');
      // localStorage.removeItem('userInfo');
      router.push('/login');
    } else if (response?.status === 403) {
      // 尝试获取更详细的错误信息
      const backendMsg = response.data?.msg || '';
      const errorDetail = response.data?.detail || '';
      
      if (backendMsg.includes("Access Denied")) {
          errorMsg = "权限不足，请联系管理员";
          router.push('/no-permission');
      } else {
          // 显示更具体的错误信息
          errorMsg = errorDetail || '禁止访问: ' + response.config.url;
      }
      
      // 记录详细调试信息
      console.error("403 Forbidden Details:", {
          url: response.config.url,
          status: response.status,
          headers: response.headers,
          data: response.data
      });
      
      // 清除无效的Token
      localStorage.removeItem('token');
    } else if (response?.status === 400) {
      errorMsg = errorMsg || '请求参数错误';
    }
    
    // 显示错误消息
    ElMessage.error(errorMsg);
    
    return Promise.reject({
      code: response?.status || 500,
      msg: errorMsg,
      data: null
    });
  }
);

export default instance