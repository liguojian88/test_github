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
              <span>{{formatTimeByTimezone(formInfo?.createTime)}}</span>
            </template>
          </a-step>
          <a-step>
            <template #title>审核中</template>
            <template #description>
              <span style="color: #979997;  width: 280px; display: inline-block;">直线经理：{{formInfo?.approvalEmployeeName}}</span>
            </template>
          </a-step>
          <a-step>
            <template #title>{{lastStepTitle}}</template>
            <template #description>
              <span v-if="formInfo?.status ==1 ||formInfo?.status ==2 ">{{formatTimeByTimezone(formInfo?.updateTime)}}</span>
            </template>
          </a-step>
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
            <span>{{formInfo?.applyId}}</span>
          </a-col>
          <a-col :span="9">
            <span class="tit">申请人部门:</span>
            <span>{{formInfo?.departmentName}}</span>
          </a-col>
          <a-col :span="6">
            <span class="tit">申请人姓名:</span>
            <span>{{formInfo?.applyEmployeeName}}</span>
          </a-col>
        </a-row>
        <a-row :wrap=true> 
          <a-col :span="9">
            <span class="tit">客户姓名:</span>
            <span>{{formInfo?.customerName}}</span>
          </a-col>
          <a-col :span="9">
            <span class="tit">客户邮箱:</span>
            <span>{{formInfo?.customerEmail}}</span>
          </a-col>
          <a-col :span="6">
            <span class="tit">文档名称:</span>
            <span>{{formInfo?.file.documentName}}</span>
            <!-- <span>devOps实施规范.doc</span> -->
          </a-col>
        </a-row>
        <a-row :wrap=true>
          <a-col :span="9">
            <div class="reason-wrapper">
              <span class="tit">申请原因:</span>
              <!-- <span class="reason-content">qwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiop</span> -->
              <span class="reason-content">{{formInfo?.reason}}</span>
            </div>
          </a-col>
          <a-col :span="9">
            <span class="tit">审核状态:</span>
            <span v-if="formInfo?.status==0">待审核</span>
            <span v-else-if="formInfo?.status==1">通过</span>
            <span v-else-if="formInfo?.status==2">驳回</span>
          </a-col>
          <a-col :span="6">
            <!-- <a-row>
              <a-col :span="7"><span class="tit">文档类型:</span></a-col>
              <a-col :span="17" style="margin-top: 10px; ">
                <span v-if="formInfo?.file.fileCategory == 0">公共[Public]</span>
                <span v-if="formInfo?.file.fileCategory == 1">内部用户[Internal Use]</span>
                <span v-if="formInfo?.file.fileCategory == 2">机密[Confidential]</span>
                <span v-if="formInfo?.file.fileCategory == 3">CSI[Critical and Sensitive Information]</span>
              </a-col>
            </a-row> -->
            <span class="tit">文档类型:</span>
            <span v-if="formInfo?.file.fileCategory == 0">公共[Public]</span>
            <span v-if="formInfo?.file.fileCategory == 1">内部用户[Internal Use]</span>
            <span v-if="formInfo?.file.fileCategory == 2">机密[Confidential]</span>
            <span v-if="formInfo?.file.fileCategory == 3">CSI[Critical and Sensitive Information]</span>
          </a-col>
        </a-row>
      </div>
    </div>
    <!-- 文件信息 -->
    <div v-if="isShowFile" class="fileInfo">
      <span class="title">文件信息：</span>
      <div class="content">
        <a-row>
          <a-col :span="12" >
            <span class="tit">文件链接：</span>
            <!-- heliang测试 -->
            <!-- <span class="fileUrl">{{`https://wcft.corpnet5.com/#/share?applyUid=${formInfo.applyUid}`}}</span>  -->
            <!-- heliang正式 -->
            <!-- <span class="fileUrl">{{`https://wcft.haleon.cn/#/share?applyUid=${formInfo.applyUid}`}}</span> -->
            <!-- 环境变量 -->
            <span class="fileUrl">{{`${baseUrl}/#/share?applyUid=${formInfo.applyUid}`}}</span> 
            <img v-if="formInfo.file.documentUrl!=null" class="copyImg"  @click.stop="Resend" src="/@/assets/images/svg/resend.svg">
            <a v-if="formInfo.file.documentUrl!=null" @click.stop="Resend" >重新发送</a>
          </a-col>
          <a-col :span="6">
            <span class="tit">下载密码：</span>
            <span>{{password}}</span>
            <img v-if="password!=null" class="copyImg"  src="/@/assets/images/svg/copy.svg" @click="copyToClipboard">
          </a-col>
          <a-col :span="6">
            <span class="tit">链接有效期至：</span>
            <!-- {{formInfo.file.fileInvalidTime}} -->
            <span>{{formatTimeByTimezone(formInfo.file.fileInvalidTime)}}</span>
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
            <span>{{formatTimeByTimezone(formInfo.file.lastDownloadTime)}}</span>
          </a-col>
        </a-row>
      </div>
    </div>
    <!-- 审批记录 -->
    <div v-if="isShowRecord" class="record">
      <span class="title">审批记录</span>
      <!-- :pagination="pagination" -->
      <a-table :columns="columns" :data-source="data"   :pagination="false" @change="changePage">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'createTime'">
            {{formatTimeByTimezone(record.createTime) }}
          </template>
          <template v-if="column.key === 'operateId'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-if="column.key === 'action'">
                <span v-if="record.action ==1"> 通过</span>
                <span v-else-if="record.action == 0"> 提交</span>
                <span v-else>驳回</span>
          </template>
        </template>
      </a-table>
    </div>
    <!-- 驳回理由 -->
    <div class="backReason" v-if="whereFrom == 'approval' && progressCount =='1' ">
      <span class="title">驳回原因</span>
      <input class="textInput" type="text" v-model="passValue.reason" placeholder="请输入驳回原因">
    </div>
    <div class="approvalBox"  v-if="whereFrom == 'approval' && progressCount =='1'" >
      <div class="btnBox">
        <a-button class="btn" type="primary"  @click="isPassApply('1')" :loading=passBtnLoading>通过</a-button>
        <a-button class="btn" type="primary" danger @click="isPassApply('2')" :loading="backBtnLoading">驳回</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {reactive,ref,onBeforeMount,onMounted,onBeforeUpdate,onUpdated,onBeforeUnmount,onUnmounted} from 'vue'
import {useRouter,useRoute} from 'vue-router'
import { message } from 'ant-design-vue';
import {shareApi} from '/@/api/business/share/share-api.js'
import {formatTimeByTimezone} from '/@/utils/time.js'
//路由
const router = useRouter()
const route = useRoute()
//vue3变量
const baseUrl = import.meta.env.VITE_APP_SSO_BASE_URL || 'https://wcft.corpnet5.com'
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
// 传过来的编号id
let applyId = ref()
// 控制按钮加载状态
let passBtnLoading = ref(false)
let backBtnLoading = ref(false)
// 判断是从哪里调过来的
let whereFrom = ref()
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
// 是否允许审批通过的参数
let passValue = ref({
  applyId:'',
  approvalResult:'',
  reason:''
})
// 通知显示的内容
const isShowFile = ref(false)
const isShowRecord = ref(false)
// 控制审批步骤条
let progressCount = ref()
// 控制步骤条的状态
let progressStatus= ref('process')
// 步骤条的最后一个DOM元素
const lastStepTitle = ref('审批完成')
//接受路由传参的变量
const formInfo = ref()
// 下载密码变量
let password = ref()

//vue3方法
const backPage=()=>{
  if(whereFrom.value == 'approval'){
    router.push("/share/approval")
  }else if(whereFrom.value == 'apply'){
    router.push("/share/list")
  }else if(whereFrom.value == 'operateLog'){
    router.push("/operate/list")
  }

}
const copyToClipboard = ()=>{
  try {
    if (navigator.clipboard)  {
         navigator.clipboard.writeText(password.value); 
         message.success(' 复制成功');
      } else {
        // 降级方案 
        const textarea = document.createElement('textarea'); 
        textarea.value  = password.value; 
        document.body.appendChild(textarea); 
        textarea.select(); 
        document.execCommand('copy'); 
        document.body.removeChild(textarea); 
        message.success(' 复制成功');
      }
    } catch (err) {
      console.error(' 复制失败:', err);
      message.error(' 复制失败，请手动复制');
    }


  // navigator.clipboard.writeText(password.value) 
  //   .then(() => {
  //     message.success('复制成功')
  //   })
  //   .catch(err => {
  //     // 备用方法 
  //     fallbackCopyToClipboard(password.value);
  //   });
}

// 获得审批记录列表
const ApprovalList = ()=>{
  shareApi.queryPageApprovalLog(approvalParameter.value).then((res)=>{
    console.log(res)
    data.value = res.data.list
    pagination.total.value =  res.data.total
  })
}

// 切换分页切换table
const changePage=(page)=>{
    // tableLoading.value=true
    pagination.value.pageNum = page.current
    pagination.value.pageSize = page.pageSize
    ApprovalList()
  }
  // 
const isPassApply=(id)=>{
  if(id == '1'){
    passBtnLoading.value=true
  }else{
    backBtnLoading.value=true
  }
  passValue.value.approvalResult = id
  shareApi.passApplyInter(passValue.value).then((res)=>{
    backBtnLoading.value = false
    passBtnLoading.value =false
    router.push("/share/approval")
  })

}
// 重新发送邮件
const Resend=()=>{
  // console.log("重新发送邮件")
  // console.log(formInfo.value.applyId)
  shareApi.sendEmail(formInfo.value.applyId).then((res)=>{
      message.success("邮件发送成功")
  })
}
//vue3生命周期
onBeforeMount(()=>{
  // 解析路由传参的参数（如果存在的话）
  applyId.value =route.query.applyId
  passValue.value.applyId = route.query.applyId
  whereFrom.value =route.query.from
  shareApi.queryDetailById(applyId.value).then((res)=>{
    // console.log(res)
    formInfo.value = res.data
    if(formInfo.value.status == '1'){
    // 通过
      isShowFile.value = true
      isShowRecord.value = true
      progressCount.value = 2
      password.value = formInfo.value.file.downloadToken
      approvalParameter.value.applyId = formInfo.value.applyId
      lastStepTitle.value = '审批通过'
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
        margin: 10px 7px 0 0;
      }
      .reason-wrapper{
        display: flex;
        align-items: flex-start;
        .reason-content{
          flex: 1;
          word-wrap: break-word;
          word-break: break-all;
          margin: 11px 0 0 0;
        }
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
      .fileUrl{
          display: inline-block; /* 或 block */
          max-width: 400px;      /* 设置最大宽度 */
          // 允许换行
          white-space: normal;
          word-wrap: break-word;
          position: relative;
          // top: 10px;
          // white-space: nowrap;   /* 禁止换行 */
          // overflow: hidden;      /* 隐藏超出部分 */
          // text-overflow: ellipsis; /* 显示省略号 */
        }
      .tit{
        display:inline-block;
        text-align: right;
        width: 100px;
        margin: 10px 5px 0 0;
        
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
  .backReason{
    background-color: white;
    margin:10px 0 20px 0;
    padding: 20px 30px 15px 15px;
    width: 100%;
    .title{
        font-size: 16px;
        font-weight: bold;
        padding: 0 0 20px 0;
    }
    .textInput{
      border: none;
      // background-color: #F5F5F5;
      border-radius: 5px;
      font-size: 16px;
      margin: 0 0 0 20px ;
      width: 90%;
    }
  }
  .approvalBox{
    display: flex;
    justify-content: center;
    .btnBox{
      width: 300px;
      display: flex;
      justify-content: space-between;
      .btn{
        width: 120px;
      }
    }
  }
}

</style>