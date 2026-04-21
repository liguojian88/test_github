<template>
    <div class="body">
      <!-- 标题 -->
      <div class="title">
        <span>编辑文件收集表单</span>
        <a-button class="backBtn" type="primary" @click="backPage">返回</a-button>
      </div>
      <!-- 表单 -->
      <div class="formBox">
        <el-form ref="addForm" :model="formState" label-width="auto" style="max-width: 600px"  :rules="rules">
          
          <el-form-item label="客户姓名" prop="customerName">
            <el-input style="width: 280px;" v-model="formState.customerName"  placeholder="请输入客户姓名"/>
          </el-form-item>
          <el-form-item label="客户邮箱" prop="customerEmail">
            <el-input style="width: 280px;" v-model="formState.customerEmail" placeholder="请输入客户邮箱" />
          </el-form-item>
          <el-form-item label="文件选择" prop="fileNumber" style="margin: 0 0 0 0;" >
            <div style="width: 280px;">
              <el-input class="upInput" style="width: 100%;" v-model="formState.fileNumber" placeholder="请选择文件数量" type="Number" >
              </el-input>
              <div style="color: gray; font-size: 12px; margin-top: 4px; line-height: 1.5;">
                *文件支持图片、Office365文档、pdf;不支持视频、压缩包方式
              </div>
              <div style="color: red; font-size: 12px; margin-top: 4px; line-height: 1.5;">
                注意：.exe，.bat，.RAR等不允许上传
              </div>
            </div>
          </el-form-item>
          <el-form-item label="申请原因" prop="reason" style="margin:20px 0 25px 0 ;">
            <el-input
              type="textarea"
              class="reason-textarea"
              v-model="formState.reason"
              placeholder="请输入申请原因，最大输入文字数为100"
              maxlength="100"
            />
          </el-form-item>
          <el-form-item   v-if="showManagerEmail == true" label="审批邮箱" prop="managerEmail">
            <el-input style="width: 280px;" v-model="formState.managerEmail"  placeholder="请输入审批邮箱"/>
            <div style="color: gray; font-size: 12px;">
              *因未找到上级人员，请手动输入上级审批人邮箱地址
            </div>
        </el-form-item>
        </el-form>
        <div class="btnBox">
           <a-button class="resetBtn" type="primary"  @click="reset()">重置</a-button>
           <a-button class="subBtn" type="primary" @click="submit()">提交</a-button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import {reactive,ref,onBeforeMount,onMounted,onBeforeUpdate,onUpdated,onBeforeUnmount,onUnmounted} from 'vue'
  import {useRouter,useRoute} from 'vue-router'
  import {collectApi} from '/@/api/business/collect/collect-api'
  import { message } from 'ant-design-vue';
  //路由
  const router = useRouter()
  const route = useRoute()
  //vue3变量------------------------------
  // 控制是否显示审批邮箱以及审批邮箱的值
  let showManagerEmail = ref(false)
  // 上传按钮绑定文件变量
  const fileList = ref([]);
  // 表单变量
  const addForm = ref()
  // 控制提交按钮点击频率
  let subFlag = ref(true)
  let formState = ref({
    applyId:'',
    customerName: null,
    customerEmail: null,
    fileNumber: null,
    reason:null,
    managerEmail:''
  });
  const rules = reactive({
    customerName:[ { required: true, message: '请输入客户姓名', trigger: 'blur' },],
    reason:[ { required: true, message: '请输入申请原因', trigger: 'blur' },],
    customerEmail:[ { required: true, message: '请输入客户邮箱', trigger: 'blur' },],
    fileNumber:[ 
      { required: true, message: '请输入文件数量', trigger: 'blur' },
      { pattern: /^[1-9]\d*$/, message: '请输入有效的正整数（不能为0或小数）', trigger: ['blur', 'change'] }
    ],
    // { validator: validateFileNumber, trigger: ['blur'] }
    managerEmail:[ 
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ],
  })

  //vue3方法-------------------------
    // 验证文件数量为正整数的自定义验证器
    const validateFileNumber = (rule, value, callback) => {
    if (!value) {
      callback(new Error('请输入文件数量'))
      return
    }
    // 转换为数字
    const num = Number(value)
    // 检查是否为有效数字
    if (isNaN(num)) {
      callback(new Error('请输入有效的数字'))
      return
    }
    // 检查是否为整数
    if (!Number.isInteger(num)) {
      callback(new Error('文件数量必须为正整数，不能输入小数'))
      return
    }
    // 检查是否为正数
    if (num <= 0) {
      callback(new Error('文件数量必须为正整数，不能输入负数或0'))
      return
    }
    callback()
  }
  // 返回按钮
  const backPage=()=>{
    router.push("/collect/list")
  }
    // 提交按钮
  const submit = ()=>{
    // console.log(formState)
    addForm.value.validate((vaild,m)=>{
      if(vaild && subFlag.value){
          subFlag.value = false
          collectApi.update(formState.value).then((res)=>{
              subFlag.value = true
              reset()
              message.success('成功')
              router.push({
                path:"/collect/list",
              })
          }).catch((res)=>{
            subFlag.value = true
          })
      }else if(m.fileNumber && m.fileNumber[0].fieldValue.trim() == ''){
        message.error('文件数量不能为空')
      }
    })
  }
  // 重置按钮
  const reset = ()=>{
    addForm.value.resetFields()
  }

  // 获取详情数据并回显到表单
  const getDetailData = () => {
    if (route.query.applyId) {
      collectApi.queryDetailById(route.query.applyId).then((res) => {
        const detailData = res.data
        // 回显表单数据
        formState.value.applyId = detailData.applyId || route.query.applyId
        formState.value.customerName = detailData.customerName || null
        formState.value.customerEmail = detailData.customerEmail || null
        formState.value.fileNumber = detailData.fileNumber || null
        formState.value.reason = detailData.reason || null
      }).catch((err) => {
        console.error('获取详情失败:', err)
        message.error('获取详情失败')
      })
    }
  }

  //vue3生命周期
  onBeforeMount(()=>{
    formState.value.applyId = route.query.applyId
    
    // 获取详情数据并回显
    getDetailData()
    
    collectApi.checkManager().then((res)=>{
      if(res.data == '1'){
        showManagerEmail.value = false
      }else if(res.data == '-1'){
        showManagerEmail.value = true
      }else{
        showManagerEmail.value = true
        formState.value.managerEmail = res.data
      }
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
    background-color: white;
    height: 87vh;
    padding:20px 15px 0 15px ;
    .title{
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
    .formBox{
      margin: 20px 0 0 0;
      .upInput:deep(.el-input__wrapper){
        padding-right: 0px;
      }
      .reason-textarea{
        width: 280px;
        :deep(.el-textarea__inner){
          height: 100px;
          resize: none;
        }
      }
      .btnBox{
        width: 359px;
        display: flex;
        justify-content: space-around;
        .resetBtn{
          width: 90px;
          background-color: #A4ADB3;
        }
        .subBtn{
          width: 90px;
        }
      }
    }
  }

  </style>