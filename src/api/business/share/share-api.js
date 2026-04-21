/**
 * 文件分享申请 api 封装
 *
 * @Author:    LouXD
 * @Date:      2025-11-12 17:25:14
 * @Copyright  1.0
 */
import { postRequest, getRequest,postFileRequest,postDownload } from '/@/lib/axios';

export const shareApi = {

  /**
   * 分页查询  @author  LouXD
   */
  queryPage : (param) => {
    return postRequest('/share/queryPageApply', param);
  },
  // 我的审批页面
  queryApprovalPage : (param) => {
    return postRequest('/share/queryPageApproval', param);
  },
  // 根据文件id查询文件审核详情
  queryDetailById : (id) => {
    return postRequest(`/share/queryById/${id}`);
  },
  // 发送邮箱
  sendEmail : (applyId) => {
    return postRequest(`/share/reSendMail/${applyId}`);
  },
  // 文件下载
  downLoadFile : (documentId,fileName) => {
    return postDownload(`/share/fileDownload/${documentId}`,fileName);
  },
  /**
   * 增加  @author  LouXD
   */
  add: (param) => {
      return postRequest('/share/add', param);
  },

  /**
   * 修改  @author  LouXD
   */
  update: (param) => {
      return postRequest('/share/update', param);
  },


  /**
   * 删除  @author  LouXD
   */
  delete: (id) => {
      return postRequest(`/share/delete/${id}`);
  },

  /**
   * 批量删除  @author  LouXD
   */
  batchDelete: (idList) => {
      return postRequest('/share/batchDelete', idList);
  },
// 查询文件详情的审批记录
  queryPageApprovalLog : (param) => {
    return postRequest('/operate/queryPageApprovalLog', param);
  },
  // 审批通过接口
  passApplyInter : (param) => {
    return postRequest('/share/approval', param);
  },
  // 文件上传
  fileUpload : (param) => {
    // return postFileRequest('/share/fileUpload', param,{ 
    //   headers: {
    //   'Content-Type': 'multipart/form-data', // 必须显式声明 
    // }});
    return postRequest('/share/fileUpload', param);
  },
  // checkManager检查上级经理
  checkManager : () => {
    return postRequest('/share/checkManager');
  },
  /**
   * 分块上传 - 初始化上传会话
   */
  initUpload: (param) => {
    return postRequest('/share/initUpload', param);
  },
  /**
   * 分块上传 - 上传分块
   */
  uploadChunk: (formData, config = {}) => {
    return postFileRequest('/share/uploadChunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // 必须显式声明
      },
      ...config // 合并额外的配置，如 signal
    });
  },
  /**
   * 分块上传 - 完成上传
   */
  completeUpload: (param) => {
    return postRequest('/share/completeUpload', param);
  },
  /**
   * 记录日志
   */
  log: (param) => {
    return postRequest('/share/log', param);
  }
};
