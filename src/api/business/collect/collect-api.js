/**
 * 文件收集申请 api 封装
 *
 * @Author:    LouXD
 * @Date:      2025-11-12 17:03:25
 * @Copyright  1.0
 */
import { postRequest, getRequest ,postDownload} from '/@/lib/axios';

export const collectApi = {

  /**
   * 分页查询  @author  LouXD
   */
  queryPage : (param) => {
    return postRequest('/collect/queryPageApply', param);
  },
  // 发送邮箱
  sendEmail : (applyId) => {
    return postRequest(`/collect/reSendMail/${applyId}`);
  },
  // 根据文件id查询文件审核详情
  queryDetailById : (id) => {
    return postRequest(`/collect/queryById/${id}`);
  },
  /**
   * 增加  @author  LouXD
   */
  add: (param) => {
      return postRequest('/collect/add', param);
  },

  /**
   * 修改  @author  LouXD
   */
  update: (param) => {
      return postRequest('/collect/update', param);
  },


  /**
   * 删除  @author  LouXD
   */
  delete: (id) => {
      return postRequest(`/collect/delete/${id}`);
  },

  /**
   * 批量删除  @author  LouXD
   */
  batchDelete: (idList) => {
      return postRequest('/collect/batchDelete', idList);
  },

  // 查询审批记录
  queryPageApprovalLog : (param) => {
    return postRequest('/operate/queryPageApprovalLog', param);
  },
   // 我的审批页面
   queryApprovalPage : (param) => {
    return postRequest('/collect/queryPageApproval', param);
  },
  // 审批通过接口
  passApplyInter : (param) => {
    return postRequest('/collect/approval', param);
  },
  // 文件下载
  downLoadFile : (documentId,fileName) => {
    console.log(111)
    return postDownload(`/collect/fileDownload/${documentId}`,fileName);
  },
  // checkManager检查上级经理
  checkManager : () => {
    return postRequest('/collect/checkManager');
  },
};
