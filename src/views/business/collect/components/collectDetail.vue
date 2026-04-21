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
              <span>{{ formatTimeByTimezone(formInfo?.createTime) }}</span>
            </template>
          </a-step>
          <a-step>
            <template #title>审核中</template>
            <template #description>
              <span style="color: #979997; width: 280px; display: inline-block;">直线经理：{{ formInfo?.approvalEmployeeName
              }}</span>
            </template>
          </a-step>
          <a-step>
            <template #title>{{ lastStepTitle }}</template>
            <template #description>
              <span v-if="formInfo?.status == 1 || formInfo?.status == 2">{{ formatTimeByTimezone(formInfo?.updateTime)
              }}</span>
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
            <span>{{ formInfo?.applyId }}</span>
          </a-col>
          <a-col :span="9">
            <span class="tit">申请人部门:</span>
            <span>{{ formInfo?.departmentName }}</span>
          </a-col>
          <a-col :span="6">
            <span class="tit">申请人姓名:</span>
            <span>{{ formInfo?.applyEmployeeName }}</span>
          </a-col>
        </a-row>
        <a-row :wrap=true>
          <a-col :span="9">
            <span class="tit">客户姓名:</span>
            <span>{{ formInfo?.customerName }}</span>
          </a-col>
          <a-col :span="9">
            <span class="tit">客户邮箱:</span>
            <span>{{ formInfo?.customerEmail }}</span>
          </a-col>
          <a-col :span="6">
            <span class="tit">文档数量:</span>
            <span> {{ formInfo?.fileNumber }}</span>
          </a-col>
        </a-row>
        <a-row :wrap=true>
          <a-col :span="9">
            <div class="reason-wrapper">
              <span class="tit">申请原因:</span>
              <span class="reason-content">{{ formInfo?.reason }}</span>
              <!-- <span class="reason-content">qwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiop</span> -->
            </div>
          </a-col>
          <a-col :span="9">
            <span class="tit">审核状态:</span>
            <span v-if="formInfo?.status == 0">待审核</span>
            <span v-else-if="formInfo?.status == 1">通过</span>
            <span v-else-if="formInfo?.status == 2">驳回</span>
          </a-col>
          <a-col :span="6">

          </a-col>
        </a-row>
        <a-row :wrap=true>
          <a-col v-if="formInfo?.status == 1" :span="9">
            <!-- <span class="tit">文件链接:</span>
            <span>{{formInfo?.files.documentUrl}} </span ><a v-if="formInfo?.files.documentUrl!=null" @click.stop="copy()">复制</a> -->
          </a-col>
          <a-col :span="9">

          </a-col>
          <a-col :span="6">

          </a-col>
        </a-row>
      </div>
    </div>
    <!-- 文件信息 -->
    <div v-if="isShowFile" class="fileInfo">
      <span class="title">文件信息1：</span>
      <div class="content">
        <!-- :pagination="pagination" @change="changePage" -->
        <a-table :columns="filesColumns" :pagination="false" :data-source="filesData">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'createTime'">
              {{ formatTimeByTimezone(record.createTime) }}
            </template>
            <!-- <template v-if="column.key === 'fileInvalidTime'">
             {{formatTimeByTimezone(record.fileInvalidTime)}}
           </template> -->
            <template v-if="column.key === 'documentId'">
              {{ index }}
            </template>
            <template v-if="column.key === 'action'">
              <a v-if="!downloadingFileIds.has(record.documentId)" @click.stop="downloadFile(record)">下载</a>
              <a v-else><a-spin size="small" /> 下载中...</a>
            </template>
          </template>
        </a-table>
      </div>
    </div>
    <!-- 审批记录 -->
    <div v-if="isShowRecord" class="record">
      <span class="title">审批记录</span>
      <a-table :columns="columns" :data-source="data" :pagination="false" @change="changePage">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'createTime'">
            {{ formatTimeByTimezone(record.createTime) }}
          </template>
          <template v-if="column.key === 'operateId'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-if="column.key === 'action'">
            <span v-if="record.action == 1"> 通过</span>
            <span v-else-if="record.action == 0"> 提交</span>
            <span v-else>驳回</span>
          </template>
        </template>
      </a-table>
    </div>
    <!-- 驳回理由 -->
    <div class="backReason" v-if="whereFrom == 'approval' && progressCount == '1'">
      <span class="title">驳回原因</span>
      <input class="textInput" type="text" v-model="passValue.reason" placeholder="请输入驳回原因">
    </div>
    <div class="approvalBox" v-if="whereFrom == 'approval' && progressCount == '1'">
      <div class="btnBox">
        <a-button class="btn" type="primary" @click="isPassApply('1')">通过</a-button>
        <a-button class="btn" type="primary" danger @click="isPassApply('2')">驳回</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue';
import { collectApi } from '/@/api/business/collect/collect-api'
import { shareApi } from '/@/api/business/share/share-api.js'
import { formatTimeByTimezone } from '/@/utils/time.js'
//路由
const router = useRouter()
const route = useRoute()
//vue3变量-----------------------------------------------------
// 审批记录表头
const columns = [
  {
    title: '编号',
    dataIndex: 'operateId',
    key: 'operateId',
  },
  {
    title: '审批人',
    dataIndex: 'operateEmployeeName',
    key: 'operateEmployeeName',
    // applyEmployeeName
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
// 文件信息表头
const filesColumns = [
  {
    title: '编号',
    dataIndex: 'documentId',
    key: 'documentId',
  },
  {
    title: '文档名称',
    dataIndex: 'documentName',
    key: 'documentName',
  },
  {
    title: '上传时间',
    dataIndex: 'createTime',
    key: 'createTime',
  },
  {
    title: '文件大小',
    key: 'fileSize',
    dataIndex: 'fileSize',
  },
  // {
  //   title: '文件有效期至',
  //   key: 'fileInvalidTime',
  //   dataIndex: 'fileInvalidTime',
  // },
  {
    title: '操作',
    key: 'action',
    dataIndex: 'action',
    width: '200px'
  },
];
let data = ref();
// 判断是从哪里调过来的
let whereFrom = ref()
// 文件信息表格数据
let filesData = ref()
// 下载状态：使用 Set 跟踪多个正在下载的文件
const downloadingFileIds = ref(new Set())
// 传过来的编号id
let applyId = ref()
// 页数设置
let pagination = ref(
  {
    total: 0,
    current: '1',
    pageSize: '10',
    showTotal: function (total) {
      return `共${total}条`
    }
  }
)
// 是否允许审批通过的参数
let passValue = ref({
  applyId: '',
  approvalResult: '',
  reason: ''
})
// 审批记录的传参
let approvalParameter = ref({
  "pageNum": pagination.value.current,
  "pageSize": pagination.value.pageSize,
  "searchCount": true,
  // 文件编号
  "applyId": "",
  // 审批类型，文件分享的申请是0，收集是审批是1
  "category": "1"
})
// 通知显示的内容
const isShowFile = ref(false)
const isShowRecord = ref(false)
// 控制审批步骤条
let progressCount = ref()
// 控制步骤条的状态
let progressStatus = ref('process')
// 步骤条的最后一个DOM元素
const lastStepTitle = ref('审批完成')
//接受路由传参的变量
const formInfo = ref()


//vue3方法--------------------------------------------------------------
const copy = () => {
  navigator.clipboard.writeText(formInfo.files.documentUrl)
    .then(() => {
      message.success('复制成功')
    })
    .catch(err => {
      // 备用方法 
      fallbackCopyToClipboard(formInfo.files.documentUrl);
    });
}
// 备用方法，兼容旧浏览器
function fallbackCopyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
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
const backPage = () => {
  if (whereFrom.value == 'approval') {
    router.push("/collect/approval")
  } else if (whereFrom.value == 'apply') {
    router.push("/collect/list")
  } else if (whereFrom.value == 'operateLog') {
    router.push("/operate/list")
  }
}
// 获得审批记录列表
const ApprovalList = () => {
  collectApi.queryPageApprovalLog(approvalParameter.value).then((res) => {
    data.value = res.data.list
    pagination.total.value = res.data.total
  })
}

// 切换分页切换table
const changePage = (page) => {
  // tableLoading.value=true
  pagination.value.pageNum = page.current
  pagination.value.pageSize = page.pageSize
  ApprovalList()
}
// 审批通过/驳回按钮
const isPassApply = (id) => {
  passValue.value.approvalResult = id
  collectApi.passApplyInter(passValue.value).then((res) => {
    router.push("/collect/approval")
  })
}
// 点击下载，文件下载
const downloadFile = async (record) => {
  console.log(record.documentName)
  console.log(record.documentId)

  // 添加到下载中集合
  downloadingFileIds.value.add(record.documentId)

  try {
    const result = await collectApi.downLoadFile(record.documentId, record.documentName)
    if (result.success) {
      message.success('下载完成')
    }
  } catch (error) {
    message.error('下载失败')
    console.error('下载错误：', error)
  } finally {
    // 从下载中集合移除
    downloadingFileIds.value.delete(record.documentId)
  }
}
//vue3生命周期
onBeforeMount(() => {
  // 解析路由传参的参数（如果存在的话）
  applyId.value = route.query.applyId
  passValue.value.applyId = route.query.applyId
  whereFrom.value = route.query.from
  collectApi.queryDetailById(applyId.value).then((res) => {
    // console.log(res)
    formInfo.value = res.data
    filesData.value = res.data.files
    if (formInfo.value.status == '1') {
      // 通过
      isShowFile.value = true
      isShowRecord.value = true
      progressCount.value = 2
      approvalParameter.value.applyId = formInfo.value.applyId
      lastStepTitle.value = '审批通过'
    } else if (formInfo.value.status == '2') {
      // 驳回
      isShowRecord.value = true
      progressCount.value = 2
      progressStatus.value = 'error'
      lastStepTitle.value = '审批驳回'
      approvalParameter.value.applyId = formInfo.value.applyId
    } else {
      progressCount.value = 1
    }
    // 获取审批记录
    ApprovalList()
  })
})
onMounted(() => {

})
onBeforeUpdate(() => { })
onUpdated(() => { })
onBeforeUnmount(() => { })
onUnmounted(() => { })
</script>

<style scoped lang="scss">
.body {
  .reason-wrapper {
    display: flex;
    align-items: flex-start;

    .reason-content {
      flex: 1;
      word-wrap: break-word;
      word-break: break-all;
      margin: 11px 0 0 0;
    }
  }

  .progress {
    background-color: white;
    padding: 20px 30px 15px 15px;
    width: 100%;

    .progressTitle {
      span {
        font-size: 16px;
        font-weight: bold;
        padding: 0 0 20px 0;
      }

      .backBtn {
        float: right;
        height: 30px;
        width: 60px;
      }
    }

    .progressContent {
      width: 70%;
      margin: 18px 0 0 12vw;
    }
  }

  .formDetail {
    background-color: white;
    margin: 10px 0 0 0;
    padding: 20px 30px 15px 15px;
    width: 100%;

    .title {
      font-size: 16px;
      font-weight: bold;
      padding: 0 0 20px 0;
    }

    .Detail {
      margin: 0 0 0 2vw;

      .tit {
        display: inline-block;
        text-align: right;
        width: 80px;
        margin: 10px 18px 0 0;
      }
    }
  }

  .fileInfo {
    background-color: white;
    margin: 10px 0 0 0;
    padding: 20px 30px 15px 15px;
    width: 100%;

    .title {
      font-size: 16px;
      font-weight: bold;
      padding: 0 0 20px 0;
    }

    .content {
      margin: 0 0 0 2vw;
    }
  }

  .record {
    background-color: white;
    margin: 10px 0 0 0;
    padding: 20px 30px 15px 15px;
    width: 100%;

    .title {
      font-size: 16px;
      font-weight: bold;
      padding: 0 0 20px 0;
    }
  }

  .backReason {
    background-color: white;
    margin: 10px 0 20px 0;
    padding: 20px 30px 15px 15px;
    width: 100%;

    .title {
      font-size: 16px;
      font-weight: bold;
      padding: 0 0 20px 0;
    }

    .textInput {
      border: none;
      // background-color: #F5F5F5;
      border-radius: 5px;
      font-size: 16px;
      margin: 0 0 0 20px;
      width: 90%;
    }
  }

  .approvalBox {
    display: flex;
    justify-content: center;

    .btnBox {
      width: 300px;
      display: flex;
      justify-content: space-between;

      .btn {
        width: 120px;
      }
    }
  }
}
</style>