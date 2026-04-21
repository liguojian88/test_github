/**
 * 操作记录 api 封装
 *
 * @Author:    LouXD
 * @Date:      2025-11-13 09:29:27
 * @Copyright  1.0
 */
import { postRequest, getRequest } from '/@/lib/axios';

export const operateApi = {

  /**
   * 分页查询  @author  LouXD
   */
  queryPage : (param) => {
    return postRequest('/operate/queryPage', param);
  },

  /**
   * 增加  @author  LouXD
   */
  add: (param) => {
      return postRequest('/operate/add', param);
  },

  /**
   * 修改  @author  LouXD
   */
  update: (param) => {
      return postRequest('/operate/update', param);
  },


  /**
   * 删除  @author  LouXD
   */
  delete: (id) => {
      return getRequest(`/operate/delete/${id}`);
  },

  /**
   * 批量删除  @author  LouXD
   */
  batchDelete: (idList) => {
      return postRequest('/operate/batchDelete', idList);
  },

};
