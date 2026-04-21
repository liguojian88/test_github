/*
 *  登录
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-09-03 21:59:58
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 */
import { getRequest, postRequest, postFileRequest } from '/@/lib/axios';

export const loginApi = {
  /**
   * 登录 @author 卓大
   */
  login: (param) => {
    return postRequest('/login', param);
  },
  // sso登录
  ssologin: () => {
    return getRequest('/api/sso/auth');
  },
  /**
   * 邮箱链接登录
   */
  loginCode: (code) => {
    return postRequest(`/login/loginByCode/${code}`, {});
  },
  getCode: () => {
    return postRequest(`/test/oneTimeCode/generate`, {});
  },
  /**
   * 退出登录 @author 卓大
   */
  logout: () => {
    return getRequest('/login/logout');
  },

  /**
   * 获取验证码 @author 卓大
   */
  getCaptcha: () => {
    return getRequest('/login/getCaptcha');
  },

  /**
   * 获取登录信息 @author 卓大
   */
  getLoginInfo: () => {
    return getRequest('/login/getLoginInfo');
  },

  /**
   * 获取邮箱登录验证码 @author 卓大
   */
  sendLoginEmailCode: (loginName) => {
    return getRequest(`/login/sendEmailCode/${loginName}`);
  },

  /**
   * 获取双因子登录标识 @author 卓大
   */
  getTwoFactorLoginFlag: () => {
    return getRequest('/login/getTwoFactorLoginFlag');
  },
  /**
   * 分享给客户端的分享详情
   */
  shareContent: (applyUid) => {
    return postRequest(`/user/share/queryByUid/${applyUid}`, {});
  },
  shareDown: (dowmloadToken) => {
    return postRequest(`/user/share/fileDownload/${dowmloadToken}`, {});
  },
  /**
   * 客户手机文件接口 提交  展示详情  文件上传  删除文件
   */
  collectSubmit: (applyUid, data) => {
    return postRequest(`/user/collect/submit/${applyUid}`, data);
  },
  collectContent: (applyUid) => {
    return postRequest(`/user/collect/queryByUid/${applyUid}`, {});
  },
  collectFileUpload: (formData) => {
    return postRequest(`/user/collect/fileUpload`, formData);
  },
  // 分片上传：初始化上传会话
  collectInitUpload: (fileName, fileSize, applyUid) => {
    return postRequest(`/user/collect/initUpload`, {
      fileName,
      fileSize,
      applyUid,
    });
  },
  // 分片上传：上传分块
  collectUploadChunk: (containerName, fileKey, chunkIndex, chunk, config = {}) => {
    const formData = new FormData();
    formData.append('containerName', containerName);
    formData.append('fileKey', fileKey);
    formData.append('chunkIndex', chunkIndex);
    formData.append('chunkData', chunk); // 上传 Base64 字符串格式
    return postFileRequest(`/user/collect/uploadChunk`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // 必须显式声明
      },
      ...config // 合并额外的配置，如 signal
    });
  },
  // 分片上传：完成上传
  collectCompleteUpload: (containerName, fileKey, fileName, totalChunks, applyUid) => {
    return postRequest(`/user/collect/completeUpload`, {
      containerName,
      fileKey,
      fileName,
      totalChunks,
      applyUid
    });
  },
  collectDelete: (documentUid) => {
    return postRequest(`/user/collect/delete/${documentUid}`, {});
  },
  // 记录上传日志
  collectLog: (params) => {
    // 支持对象参数 { applyUid, fileName, reason } 或独立参数
    if (typeof params === 'object' && params.applyUid !== undefined) {
      return postRequest(`/user/collect/log`, {
        applyUid: params.applyUid,
        fileName: params.fileName,
        reason: params.reason
      });
    } else {
      // 兼容旧的调用方式
      return postRequest(`/user/collect/log`, {
        applyUid: arguments[0],
        fileName: arguments[1],
        reason: arguments[2]
      });
    }
  }
};
