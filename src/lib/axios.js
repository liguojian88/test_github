/*
 *  ajax请求
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-09-06 20:46:03
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 */
import { message, Modal } from 'ant-design-vue';
import axios from 'axios';
import { localRead } from '/@/utils/local-util';
import { useUserStore } from '/@/store/modules/system/user';
import { decryptData, encryptData } from './encrypt';
import { DATA_TYPE_ENUM } from '../constants/common-const';
import _ from 'lodash';
import LocalStorageKeyConst from '/@/constants/local-storage-key-const.js';
import { formatTimeByTimezone } from '/@/utils/time.js';

// token的消息头
const TOKEN_HEADER = 'Authorization';

// 创建axios对象
const smartAxios = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
});

// 退出系统
function logout() {
  useUserStore().logout();
  location.href = '/';
}

// ================================= 请求拦截器 =================================

smartAxios.interceptors.request.use(
  (config) => {
    // 在发送请求之前消息头加入token token
    const token = localRead(LocalStorageKeyConst.USER_TOKEN);
    if (token) {
      config.headers[TOKEN_HEADER] = 'Bearer ' + token;
    } else {
      delete config.headers[TOKEN_HEADER];
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// ================================= 响应拦截器 =================================

// 添加响应拦截器
smartAxios.interceptors.response.use(
  (response) => {
    // 根据content-type ，判断是否为 json 数据
    let contentType = response.headers['content-type'] ? response.headers['content-type'] : response.headers['Content-Type'];
    if (contentType.indexOf('application/json') === -1) {
      return Promise.resolve(response);
    }

    // 如果是json数据
    if (response.data && response.data instanceof Blob) {
      return Promise.reject(response.data);
    }

    // 如果是加密数据
    if (response.data.dataType === DATA_TYPE_ENUM.ENCRYPT.value) {
      response.data.encryptData = response.data.data;
      let decryptStr = decryptData(response.data.data);
      if (decryptStr) {
        response.data.data = JSON.parse(decryptStr);
      }
    }

    const res = response.data;
    if (res.code && res.code !== 1) {
      // `token` 过期或者账号已在别处登录
      // 判断当前是否在 collect 或 share 页面，如果是则跳过自动登出
      const currentPath = window.location.hash.replace('#', '') || '/';
      const removeHashPath = currentPath.split('?')[0]; // 去掉查询参数
      const isPublicPage = removeHashPath === '/collect' || removeHashPath === '/share';

      if (res.code === 30007 || res.code === 30008) {
        if (!isPublicPage) {
          message.destroy();
          message.error('您没有登录，请重新登录');
          setTimeout(logout, 300);
        }
        return Promise.reject(response);
      }

      // 等保安全的登录提醒
      if (res.code === 30010 || res.code === 30011) {
        // 后端返回的 msg 中一般包含锁定截止时间，如：2026-02-04 08:47:37
        // 这里截取并按用户时区格式化后再展示
        let content = res.msg;
        if (typeof content === 'string') {
          const timeReg = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
          const match = content.match(timeReg);
          if (match && match[0]) {
            const originalTime = match[0];
            const formattedTime = formatTimeByTimezone(originalTime);
            if (formattedTime) {
              content = content.replace(originalTime, formattedTime);
            }
          }
        }
        Modal.error({
          title: '重要提醒1',
          content,
        });
        return Promise.reject(response);
      }

      // 长时间未操作系统，需要重新登录
      if (res.code === 30012) {
        Modal.error({
          title: '重要提醒',
          content: res.msg,
          onOk: logout,
        });
        setTimeout(logout, 3000);
        return Promise.reject(response);
      }
      message.destroy();
      if (res.code != 10001) {
        message.error(res.msg);
      }
      return Promise.reject(response);
    } else {
      return Promise.resolve(res);
    }
  },
  (error) => {
    // 对响应错误做点什么
    // 如果服务器返回了响应（有 error.response），说明是业务错误，不应该显示网络错误
    // 特别是 403 错误，让组件自己处理
    // 对于文件选择的修改403状态码问题，捕获不到403，如果这样修改其他的会不会出现问题？
    if (error.message) {
      // 如果是 403 错误，不显示默认错误提示，让组件自己处理
      if (error.message == "Network Error") {
        return Promise.reject(error);
      }
      // 其他服务器错误已经在响应拦截器的成功回调中处理了（第 78-108 行）
      return Promise.reject(error);
    }

    // 只有真正的网络错误（没有 response 对象）才显示网络错误提示
    if (error.message.indexOf('timeout') !== -1) {
      message.destroy();
      message.error('网络超时');
    } else if (error.message === 'Network Error') {
      message.destroy();
      message.error('网络连接错误');
    } else if (error.message.indexOf('Request') !== -1) {
      message.destroy();
      message.error('网络发生错误');
    }
    return Promise.reject(error);
  }
);

// ================================= 对外提供请求方法：通用请求，get， post, 下载download等 =================================

/**
 * get请求
 */
export const getRequest = (url, params) => {
  return request({ url, method: 'get', params });
};

/**
 * 通用请求封装
 * @param config
 */
export const request = (config) => {
  return smartAxios.request(config);
};

/**
 * post请求
 */
export const postRequest = (url, data) => {
  return request({
    data,
    url,
    method: 'post',
  });
};
/**
 * post请求上传文件
 */
export const postFileRequest = (url, data, headers) => {
  return smartAxios.post(url, data, headers)
};
// ================================= 加密 =================================

/**
 * 加密请求参数的post请求
 */
export const postEncryptRequest = (url, data) => {
  return request({
    data: { encryptData: encryptData(data) },
    url,
    method: 'post',
  });
};

// ================================= 下载 =================================

export const postDownload = function (url, fileName) {
  return request({
    method: 'post',
    url,
    responseType: 'blob',
  })
    .then((data) => {
      handleDownloadData(data, fileName);
      return { success: true };
    })
    .catch((error) => {
      // handleDownloadError(error);
      return { success: false, error };
    });
};

/**
 * 文件下载
 */
export const getDownload = function (url, params) {
  request({
    method: 'get',
    url,
    params,
    responseType: 'blob',
  })
    .then((data) => {
      handleDownloadData(data);
    })
    .catch((error) => {
      handleDownloadError(error);
    });
};

function handleDownloadError(error) {
  if (error instanceof Blob) {
    const fileReader = new FileReader();
    fileReader.readAsText(error);
    fileReader.onload = () => {
      const msg = fileReader.result;
      const jsonMsg = JSON.parse(msg);
      message.destroy();
      message.error(jsonMsg.msg);
    };
  } else {
    message.destroy();
    message.error('网络发生错误', error);
  }
}

function handleDownloadData(response, filename) {
  if (!response) {
    return;
  }
  console.log(response)
  // 获取返回类型
  let contentType = _.isUndefined(response.headers['content-type']) ? response.headers['Content-Type'] : response.headers['content-type'];

  // 构建下载数据
  let url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
  let link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  // 从消息头获取文件名
  // let str = _.isUndefined(response.headers['content-disposition'])
  //   ? response.headers['Content-Disposition'].split(';')[1]
  //   : response.headers['content-disposition'].split(';')[1];

  // let filename = _.isUndefined(str.split('fileName=')[1]) ? str.split('filename=')[1] : str.split('fileName=')[1];

  link.setAttribute('download', decodeURIComponent(filename));

  // 触发点击下载
  document.body.appendChild(link);
  link.click();

  // 下载完释放
  document.body.removeChild(link); // 下载完成移除元素
  window.URL.revokeObjectURL(url); // 释放掉blob对象
}
