<template>
    <div class="body">
      <!-- 审批进度 -->
      <div class="progress">
        <div class="progressTitle">
          <span>审批进度</span>
          <a-button class="backBtn" type="primary" @click="backPage">返回</a-button>
        </div>
        <div class="progressContent">
          <a-steps :current="progressCount" :status="progressStatus">
            <a-step>
              <template #title>提交申请</template>
              <template #description>
                <span>{{formInfo.createTime}}</span>
              </template>
            </a-step>
            <a-step>
              <template #title>审核中</template>
              <template #description>
                <span style="color: #979997;  width: 280px; display: inline-block;">直线经理：{{formInfo?.approvalEmployeeName }}</span>
              </template>
            </a-step>
            <a-step>
              <template #title>{{lastStepTitle}}</template>
              <template #description>
                <span v-if="formInfo.status ==1 ">{{formInfo.updateTime}}</span>
              </template>
            </a-step>
            <!-- <a-step  :title="lastStepTitle" description="2025-11-25 11:15" /> -->
          </a-steps>
        </div>
      </div>
      <!-- 表单详情 -->
      <div class="formDetail">
        <span class="title">表单详情</span>
        <div class="Detail">
          <a-row :wrap=true>
            <a-col :span="9">
              <span class="tit">编号:</span>
              <span>{{formInfo.applyId}}</span>
            </a-col>
            <a-col :span="9">
              <span class="tit">申请人部门:</span>
              <span>{{formInfo.departmentName}}</span>
            </a-col>
            <a-col :span="6">
              <span class="tit">申请人姓名:</span>
              <span>{{formInfo.applyEmployeeName}}</span>
            </a-col>
          </a-row>
          <a-row :wrap=true> 
            <a-col :span="9">
              <span class="tit">客户姓名:</span>
              <span>{{formInfo.customerName}}</span>
            </a-col>
            <a-col :span="9">
              <span class="tit">客户邮箱:</span>
              <span>{{formInfo.customerEmail}}</span>
            </a-col>
            <a-col :span="6">
              <span class="tit">文档名称:</span>
              <span>{{formInfo.file.documentName}}</span>
              <!-- <span>devOps实施规范.doc</span> -->
            </a-col>
          </a-row>
          <a-row :wrap=true>
            <a-col :span="9">
              <span class="tit">申请原因:</span>
              <span>{{formInfo.reason}}</span>
            </a-col>
            <a-col :span="9">
              <span class="tit">审核状态:</span>
              <span v-if="formInfo.status==0">待审核</span>
              <span v-else-if="formInfo.status==1">通过</span>
              <span v-else-if="formInfo.status==2">驳回</span>
            </a-col>
            <a-col :span="6">
              <span class="tit">文档类型:</span>
              <span v-if="formInfo.file.fileCategory == 0">公共[Public]</span>
              <span v-if="formInfo.file.fileCategory == 1">内部用户[Internal Use]</span>
              <span v-if="formInfo.file.fileCategory == 2">机密[Confidential]</span>
              <span v-if="formInfo.file.fileCategory == 3">CSI[Critical and Sensitive Information]</span>
            </a-col>
          </a-row>
        </div>
      </div>
      <!-- 文件信息 -->
      <div v-if="isShowFile" class="fileInfo">
        <span class="title">文件信息：</span>
        <div class="content">
          <a-row>
            <a-col :span="12">
              <span class="tit">文件链接：</span>
              <span>{{formInfo.file.documentUrl}}</span>
              <span>重新发送</span>
            </a-col>
            <a-col :span="6">
              <span class="tit">下载密码：</span>
              <span>{{password}}</span>
              <img class="copyImg"  src="/@/assets/images/svg/copy.svg" @click="copyToClipboard">
              <!-- <CopyOutlined @click="copyToClipboard" /> -->
            </a-col>
            <a-col :span="6">
              <span class="tit">链接有效期至：</span>
              <span>{{formInfo.file.fileInvalidTime}}</span>
            </a-col>
          </a-row>
          <a-row>
            <a-col :span="12">
              <span class="tit">下载次数：</span>
              <span>{{formInfo.file.maxDownloads}}次</span>
            </a-col>
            <a-col :span="6">
              <span class="tit">已下载：</span>
              <span>{{formInfo.file.numberOfDownloaded}}次</span>
            </a-col>
            <a-col :span="6">
              <span class="tit">下载时间：</span>
              <span>{{formInfo.file.lastDownloadTime}}</span>
            </a-col>
          </a-row>
        </div>
      </div>
      <!-- 审批记录 -->
      <div v-if="isShowRecord" class="record">
        <span class="title">审批记录</span>
        <a-table :columns="columns" :data-source="data" :pagination="pagination" @change="changePage">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
                  <span v-if="record.action ==1"> 通过</span>
                  <span v-else>驳回</span>
            </template>
          </template>
        </a-table>
      </div>
    </div>
  </template>
  
  <script setup>
  import {reactive,ref,onBeforeMount,onMounted,onBeforeUpdate,onUpdated,onBeforeUnmount,onUnmounted} from 'vue'
  import {useRouter,useRoute} from 'vue-router'
  import { message } from 'ant-design-vue';
  import {shareApi} from '/@/api/business/share/share-api.js'
  //路由
  const router = useRouter()
  const route = useRoute()
  //vue3变量
  const columns = [
    {
      title:'编号',
      dataIndex: 'operateId',
      key: 'operateId',
    },
    {
      title: '审批人',
      dataIndex: 'operateEmployeeName',
      key: 'operateEmployeeName',
      //applyEmployeeName
    },
    {
      title: '审批结果',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: '驳回原因',
      key: 'remark',
      dataIndex: 'remark',
    },
    {
      title: '审批时间',
      key: 'createTime',
      dataIndex: 'createTime',
    },
  ];
  let data = ref();
  // 页数设置
  let pagination = ref(
      {
        total:0,
        current:'1',
        pageSize:'10',
        showTotal: function(total){
          return `共${total}条`
        }
      }
    )
  let approvalParameter = ref({
      "pageNum": pagination.value.current,
      "pageSize":  pagination.value.pageSize,
      "searchCount": true,
      // 文件编号
      "applyId": "",
      // 审批类型，文件分享的申请是0，收集是审批是1
      "category": "0"
  })
  // 通知显示的内容
  const isShowFile = ref(false)
  const isShowRecord = ref(false)
  // 控制审批步骤条
  let progressCount = ref()
  // 控制步骤条的状态
  let progressStatus= ref('process')
  // 步骤条的最后一个DOM元素
  const lastStepTitle = ref('审批通过')
  //接受路由传参的变量
  const formInfo = ref()
  // 下载密码变量
  let password = ref()
  
  //vue3方法
  const backPage=()=>{
    router.push("/share/list")
  }
  const copyToClipboard = ()=>{
    navigator.clipboard.writeText(password.value) 
      .then(() => {
        message.success('复制成功')
      })
      .catch(err => {
        // 备用方法 
        fallbackCopyToClipboard(password.value);
      });
  }
  // 备用方法，兼容旧浏览器
  function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea'); 
    textarea.value  = text;
    document.body.appendChild(textarea); 
    textarea.select(); 
    try {
      document.execCommand('copy'); 
      alert('密码已复制到剪贴板');
    } catch (err) {
      console.error(' 复制失败:', err);
    }
    document.body.removeChild(textarea); 
  }
  // 获得审批记录列表
  const ApprovalList = ()=>{
    shareApi.queryPageApprovalLog(approvalParameter.value).then((res)=>{
      data.value = res.data.list
      pagination.value =  res.data.total
    })
  }
  
  // 切换分页切换table
  const changePage=(page)=>{
      // tableLoading.value=true
      pagination.value.pageNum = page.current
      pagination.value.pageSize = page.pageSize
      ApprovalList()
    }
  //vue3生命周期
  onBeforeMount(()=>{
    // 解析路由传参的参数（如果存在的话）
    formInfo.value = JSON.parse(route.query.info) 
    
    if(formInfo.value.status == '1'){
      // 通过
      isShowFile.value = true
      isShowRecord.value = true
      progressCount.value = 2
      password.value = formInfo.value.downloadToken
      approvalParameter.value.applyId = formInfo.value.applyId
    }else if(formInfo.value.status == '2'){
      // 驳回
      isShowRecord.value = true
      progressCount.value =2
      progressStatus.value = 'error'
      lastStepTitle.value = '审批驳回'
      approvalParameter.value.applyId = formInfo.value.applyId
    }else{
      progressCount.value =1
    }
    // 获取审批记录
    ApprovalList()
  })
  onMounted(()=>{
  
  })
  onBeforeUpdate(()=>{})
  onUpdated(()=>{})
  onBeforeUnmount(()=>{})
  onUnmounted(()=>{})
  </script>
  
  <style scoped lang="scss">
  .body{
    .progress{
      background-color: white;
      padding: 20px 30px 15px 15px;
      width: 100%;
      .progressTitle{
        span{
          font-size: 16px;
          font-weight: bold;
          padding: 0 0 20px 0;
        }
        .backBtn{
          float: right;
          height: 30px;
          width: 60px;
        }
      }
      .progressContent{
        width: 70%;
        margin: 18px 0 0 12vw;
      }
    }
    .formDetail{
      background-color: white;
      margin:10px 0 0 0;
      padding: 20px 30px 15px 15px;
      width: 100%;
      .title{
          font-size: 16px;
          font-weight: bold;
          padding: 0 0 20px 0;
      }
      .Detail{
        margin:  0 0 0 2vw;
        .tit{
          display:inline-block;
          text-align: right;
          width: 80px;
          margin: 10px 18px 0 0;
        }
      }
    }
    .fileInfo{
      background-color: white;
      margin:10px 0 0 0;
      padding: 20px 30px 15px 15px;
      width: 100%;
      .title{
          font-size: 16px;
          font-weight: bold;
          padding: 0 0 20px 0;
      }
      .content{
        margin:  0 0 0 2vw;
        .tit{
          display:inline-block;
          text-align: right;
          width: 100px;
          margin: 10px 18px 0 0;
          
        }
        .copyImg:hover{
            cursor: pointer;
          }
        .copyImg{
            margin:  0 0 4px 3px;
            width: 15px;
            color: red;
          }
      }
    }
    .record{
      background-color: white;
      margin:10px 0 0 0;
      padding: 20px 30px 15px 15px;
      width: 100%;
      .title{
          font-size: 16px;
          font-weight: bold;
          padding: 0 0 20px 0;
      }
    }
  }
  
  </style>