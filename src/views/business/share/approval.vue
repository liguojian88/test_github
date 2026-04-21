<template>
  <div class="body">
    <div class="title">
      申请查询
    </div>
    <div class="queryBox">
      <el-form class="form" ref="queryForm" :inline="true" :model="form" label-width="auto">
        <el-form-item label="申请人" label-position="left" prop="applyEmployeeName">
          <el-input style="width: 254px;" v-model="form.applyEmployeeName" placeholder="请输入申请人姓名" />
        </el-form-item>
        <el-form-item label="申请时间" label-position="left" style="width: 380px ;">
          <el-col :span="11">
            <el-form-item prop="createTimeBegin" style="margin: 0 0 0 0 ">
              <el-date-picker v-model="form.createTimeBegin" type="date" aria-label="Pick a date" placeholder="开始日期"
                value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col class="text-center" :span="2" style="text-align: center;">
            <span class="text-gray-500" style="margin: 0 ;">至</span>
          </el-col>
          <el-col :span="11">
            <el-form-item prop="createTimeEnd" style="margin: 0 0 0 0 ">
              <el-date-picker v-model="form.createTimeEnd" type="date" aria-label="Pick a date"
                value-format="YYYY-MM-DD" placeholder="结束日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-form-item>
        <el-form-item label="客户姓名" label-position="left" prop="customerName">
          <el-input style="width: 254px;" v-model="form.customerName" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="客户邮箱" label-position="left" prop="customerEmail">
          <el-input style="width: 254px;" v-model="form.customerEmail" placeholder="请输入客户邮箱" />
        </el-form-item>
        <el-form-item label="审批状态" label-position="left" prop="status">
          <a-space>
            <a-select ref="select" v-model:value="form.status" style="width: 254px" :options="options1"></a-select>
          </a-space>
        </el-form-item>
        <el-form-item>
          <a-button type="primary" @click="submit">
            <template #icon>
              <SearchOutlined />
            </template>
            查询
          </a-button>
          <a-button @click="reset" class="smart-margin-left10">
            <template #icon>
              <ReloadOutlined />
            </template>
            重置
          </a-button>
        </el-form-item>
      </el-form>
    </div>
    <a-divider style="border-color: #CCD3DB; margin:  0 0 0 0;" />
    <div class="tableBox">
      <a-table class="table" :dataSource="dataSource" :columns="columns" :pagination="pagination" @change="changePage"
        :loading="tableLoading">
        <!-- 表头插槽 -->
        <!-- <template #headerCell="{ column }">
            <template v-if="column.key === 'name'">
              <span>
                <smile-outlined />
                Name
              </span>
            </template>
          </template> -->
        <!-- 内容插槽 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createTime'">
            {{ formatTimeByTimezone(record.createTime) }}
          </template>
          <template v-if="column.key === 'action'">
            <a v-if="record.status == '0'" @click.stop="jumpDetail(record)">
              审核
            </a>
          </template>
          <template v-else-if="column.key === 'applyId'">
            <a @click.stop="jumpDetail(record)">
              {{ record.applyId }}
            </a>
          </template>
          <template v-else-if="column.key === 'status'">
            <span v-if="record.status == '0'" style="color: green;">
              待审核
            </span>
            <span v-if="record.status == '1'" style="color: blue;">
              通过
            </span>
            <span v-if="record.status == '2'" style="color: red;">
              驳回
            </span>
          </template>
          <template v-else-if="column.key === 'file'">
            <a @click.stop="downloadFile(record)">
              {{ record.file.documentName }}
            </a>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue'
import dayjs from 'dayjs';
import { shareApi } from '/@/api/business/share/share-api.js'
import { useRouter, useRoute } from 'vue-router'
import { formatTimeByTimezone } from '/@/utils/time.js'
// 路由
const router = useRouter()
const route = useRoute()
// 变量 --------------------------------------------
// queryBox盒子 form表单查询相关的变量和方法
const form = reactive({
  pageNum: '1',
  pageSize: '10',
  applyEmployeeName: '',
  createTimeBegin: '',
  createTimeEnd: '',
  customerName: "",
  customerEmail: '',
  status: '',
})
// form表单DOM元素
const queryForm = ref()
// 审批状态下拉框变量
const options1 = ref([
  {
    value: '',
    label: '全部',
    select: true
  },
  {
    value: '0',
    label: '待审核',
  },
  {
    value: '1',
    label: '通过',
  },
  {
    value: '2',
    label: '驳回',
  },
]);
// 控制表单加载状态
let tableLoading = ref(true)

// 审批表格
const columns = reactive(
  [
    {
      name: 'applyId',
      title: "编号",
      dataIndex: 'applyId',
      key: 'applyId',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      })
    },
    {
      name: 'applyEmployeeName',
      title: "申请人",
      dataIndex: 'applyEmployeeName',
      key: 'applyEmployeeName',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },

    {
      name: 'departmentName',
      title: "部门",
      dataIndex: 'departmentName',
      key: 'departmentName',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      name: 'customerName',
      title: "客户姓名",
      dataIndex: 'customerName',
      key: 'customerName',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      name: 'customerEmail',
      title: "客户邮箱",
      dataIndex: 'customerEmail',
      key: 'customerEmail',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
      // width:150,
      // ellipsis: true,  // 超出显示省略号 
    },
    {
      name: 'file',
      title: "文档名称",
      dataIndex: 'file',
      key: 'file',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      name: 'reason',
      title: "原因",
      dataIndex: 'reason',
      key: 'reason',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      title: '审核状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
  ]
)

const dataSource = ref()
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
// 方法------------------------------------------------------
// 下载文件
const downloadFile = (record) => {
  shareApi.downLoadFile(record.file.documentId, record.file.documentName)
}
// 切换分页切换table
const changePage = (page) => {
  tableLoading.value = true
  form.pageNum = page.current
  form.pageSize = page.pageSize
  getTable()
}
// 提交表单
const submit = () => {
  form.pageNum = '1'
  tableLoading.value = true
  // 处理时间格式：开始日期添加 00:00:00，结束日期添加 23:59:59
  if (form.createTimeBegin) {
    form.createTimeBegin = dayjs(form.createTimeBegin).format('YYYY-MM-DD 00:00:00')
  }
  if (form.createTimeEnd) {
    form.createTimeEnd = dayjs(form.createTimeEnd).format('YYYY-MM-DD 23:59:59')
  }
  getTable()
}
const reset = () => {
  form.pageNum = '1'
  queryForm.value.resetFields();
  tableLoading.value = true
  getTable()
}
// 获取table数据
const getTable = () => {
  shareApi.queryApprovalPage(form).then((res) => {
    dataSource.value = res.data.list
    pagination.value.total = res.data.total
    pagination.value.current = res.data.pageNum
    tableLoading.value = false
  })
}
const jumpDetail = (record) => {
  router.push({
    path: "/share/list/applyDetail",
    query: {
      applyId: record.applyId,
      from: 'approval'
    }
  })
}
//vue3生命周期
onBeforeMount(() => {
  getTable();
})
onMounted(() => { })
onBeforeUpdate(() => { })
onUpdated(() => { })
onBeforeUnmount(() => { })
onUnmounted(() => { })
</script>

<style scoped lang="scss">
.body {
  background-color: white;
  height: 87vh;
  padding: 20px 15px 0 15px;
}

.title {
  font-size: 2vh;
  font-weight: bold;
  padding: 0 0 20px 0;
}

.queryBox {
  .form {
    // max-width: 80vw;
  }
}

.tableBox {
  margin: 15px 0 0 0;

  .table :deep(.ant-table-cell) {
    max-width: 200px;
    white-space: normal;
    /* 允许换行（覆盖默认的 nowrap） */
    word-break: break-word;
  }
}
</style>