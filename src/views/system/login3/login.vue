<!--
  * 登录
  *
  * @Author:    1024创新实验室-主任：卓大
  * @Date:      2022-09-12 22:34:00
  * @Wechat:    zhuda1024
  * @Email:     lab1024@163.com
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
  *
-->
<template>
   <a-row>
    <a-col :span="16" style="background-color: #1C84C6;"></a-col>
    <a-col :span="8">
      <div class="login-container">
        <div class="box-item login">
          <div class="login-title">WeCom File Transfer</div>
          <a-form ref="formRef" class="login-form" :model="loginForm" :rules="rules">
            <a-form-item name="loginName">
              <a-input v-model:value.trim="loginForm.loginName" placeholder="请输入用户名" >
                <template #prefix>
                  <img src="/@/assets/images/svg/loginImgA.svg" style="width: 15px; margin-right: 5px;">
                </template> 
              </a-input>
            </a-form-item>
            <a-form-item name="emailCode" v-if="emailCodeShowFlag">
              <a-input-group compact>
                <a-input style="width: calc(100% - 110px)" v-model:value="loginForm.emailCode" autocomplete="on" placeholder="请输入邮箱验证码" />
                <a-button @click="sendSmsCode" class="code-btn" type="primary" :disabled="emailCodeButtonDisabled">
                  {{ emailCodeTips }}
                </a-button>
              </a-input-group>
            </a-form-item>
            <a-form-item name="password">
              <a-input-password
                v-model:value="loginForm.password"
                autocomplete="on"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码：至少三种字符，最小 8 位"
              >
                <template #prefix>
                   <img src="/@/assets/images/svg/loginPsw.svg" style="width: 15px; margin-right:5px;">
                </template>
              </a-input-password>
            </a-form-item>
            <a-form-item name="captchaCode">
              <a-input class="captcha-input" v-model:value.trim="loginForm.captchaCode" placeholder="请输入验证码" />
              <img class="captcha-img" :src="captchaBase64Image" @click="getCaptcha" />
            </a-form-item>
            <a-form-item>
              <a-checkbox v-model:checked="rememberPwd">记住密码</a-checkbox>
              <!-- <span> ( 账号：admin, 密码：123456)</span> -->
            </a-form-item>
            <a-form-item>
              <div class="btn"  @click="onLogin">登录</div>
            </a-form-item>
            <a-form-item>
              <div class="btn" @click="SSOLogin">SSO登录</div>
            </a-form-item>
          </a-form>
        </div>
      </div>
    </a-col>
  </a-row>

  </template>
  <script setup>
    import { message } from 'ant-design-vue';
    import { onMounted, onUnmounted, reactive, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { loginApi } from '/@/api/system/login-api';
    import { SmartLoading } from '/@/components/framework/smart-loading';
    import { LOGIN_DEVICE_ENUM } from '/@/constants/system/login-device-const';
    import { useUserStore } from '/@/store/modules/system/user';
  
    import { buildRoutes } from '/@/router/index';
    import { smartSentry } from '/@/lib/smart-sentry';
    import { encryptData } from '/@/lib/encrypt';
    import { localSave } from '/@/utils/local-util.js';
    import LocalStorageKeyConst from '/@/constants/local-storage-key-const.js';
    import { useDictStore } from '/@/store/modules/system/dict.js';
    import { dictApi } from '/@/api/support/dict-api.js';
  
    //--------------------- 登录表单 ---------------------------------
  
    const loginForm = reactive({
      loginName: '',
      password: '',
      captchaCode: '',
      captchaUuid: '',
      loginDevice: LOGIN_DEVICE_ENUM.PC.value,
    });
    const rules = {
      loginName: [{ required: true, message: '用户名不能为空' }],
      password: [{ required: true, message: '密码不能为空' }],
      captchaCode: [{ required: true, message: '验证码不能为空' }],
    };
  
    const showPassword = ref(false);
    const router = useRouter();
    const route = useRoute();
    const formRef = ref();
    const rememberPwd = ref(false);
  
    onMounted(() => {
      document.onkeyup = (e) => {
        if (e.keyCode === 13) {
          onLogin();
        }
      };
    });
  
    onUnmounted(() => {
      document.onkeyup = null;
    });
  
    //登录
    async function onLogin() {
      formRef.value.validate().then(async () => {
        try {
          SmartLoading.show();
          // 密码加密
          let encryptPasswordForm = Object.assign({}, loginForm, {
            password: encryptData(loginForm.password),
          });
          const res = await loginApi.login(encryptPasswordForm);
          stopRefreshCaptchaInterval();
          localSave(LocalStorageKeyConst.USER_TOKEN, res.data.token ? res.data.token : '');
          message.success('登录成功');
          //更新用户信息到pinia
          useUserStore().setUserLoginInfo(res.data);
          // 初始化数据字典
          const dictRes = await dictApi.getAllDictData();
          useDictStore().initData(dictRes.data);
          //构建系统的路由
          buildRoutes();
          // 如果带了 redirect（比如 code 登录失败后跳转到登录页），登录成功后优先回跳
          const redirect = route.query?.redirect;
          console.log("携带的redirect重定向位置为:"+redirect)
          if (redirect && typeof redirect === 'string' && redirect !== '/login') {
            router.push(redirect);
          } else {
            router.push('/home');
          }
        } catch (e) {
          if (e.data && e.data.code !== 0) {
            loginForm.captchaCode = '';
            getCaptcha();
          }
          smartSentry.captureError(e);
        } finally {
          SmartLoading.hide();
        }
      });
    }
  // sso登录
  const SSOLogin = ()=>{
    console.log("sso登录")
    const redirect = route.query?.redirect;
    const ssoBaseUrl = import.meta.env.VITE_APP_SSO_BASE_URL || 'https://wcft.corpnet5.com'; 
    let ssoUrl = `${ssoBaseUrl}/prod-api/api/sso/auth`;   
    // let ssoUrl = "https://wcft.corpnet5.com/prod-api/api/sso/auth"; //heliang测试
    // let ssoUrl = "https://wcft.haleon.cn/prod-api/api/sso/auth";  //heliang正式
    
    if (redirect && typeof redirect === 'string') {
      let enCodeUrl = `${ssoBaseUrl}/#${redirect}`  
      // let enCodeUrl = `https://wcft.corpnet5.com/#${redirect}`//heliang测试
      // let enCodeUrl = `https://wcft.haleon.cn/#${redirect}`//heliang正式
      ssoUrl += `?url=${encodeURIComponent(enCodeUrl)}`; 
    }
    console.log("SSO跳转地址"+ssoUrl)
    location.assign(ssoUrl);
  }
    //--------------------- 验证码 ---------------------------------
  
    const captchaBase64Image = ref('');
    async function getCaptcha() {
      try {
        let captchaResult = await loginApi.getCaptcha();
        captchaBase64Image.value = captchaResult.data.captchaBase64Image;
        loginForm.captchaUuid = captchaResult.data.captchaUuid;
        beginRefreshCaptchaInterval(captchaResult.data.expireSeconds);
      } catch (e) {
        console.log(e);
      }
    }
  
    let refreshCaptchaInterval = null;
    function beginRefreshCaptchaInterval(expireSeconds) {
      if (refreshCaptchaInterval === null) {
        refreshCaptchaInterval = setInterval(getCaptcha, (expireSeconds - 5) * 1000);
      }
    }
  
    function stopRefreshCaptchaInterval() {
      if (refreshCaptchaInterval != null) {
        clearInterval(refreshCaptchaInterval);
        refreshCaptchaInterval = null;
      }
    }
  
    onMounted(() => {
      getCaptcha();
      getTwoFactorLoginFlag();
    });
  
    //--------------------- 邮箱验证码 ---------------------------------
  
    const emailCodeShowFlag = ref(false);
    let emailCodeTips = ref('获取邮箱验证码');
    let emailCodeButtonDisabled = ref(false);
    // 定时器
    let countDownTimer = null;
    // 开始倒计时
    function runCountDown() {
      emailCodeButtonDisabled.value = true;
      let countDown = 60;
      emailCodeTips.value = `${countDown}秒后重新获取`;
      countDownTimer = setInterval(() => {
        if (countDown > 1) {
          countDown--;
          emailCodeTips.value = `${countDown}秒后重新获取`;
        } else {
          clearInterval(countDownTimer);
          emailCodeButtonDisabled.value = false;
          emailCodeTips.value = '获取验证码';
        }
      }, 1000);
    }
  
    // 获取双因子登录标识
    async function getTwoFactorLoginFlag() {
      try {
        let result = await loginApi.getTwoFactorLoginFlag();
        emailCodeShowFlag.value = result.data;
      } catch (e) {
        smartSentry.captureError(e);
      }
    }
  
    // 发送邮箱验证码
    async function sendSmsCode() {
      try {
        SmartLoading.show();
        let result = await loginApi.sendLoginEmailCode(loginForm.loginName);
        message.success('验证码发送成功!请登录邮箱查看验证码~');
        runCountDown();
      } catch (e) {
        smartSentry.captureError(e);
      } finally {
        SmartLoading.hide();
      }
    }
  </script>
  <style lang="less" scoped>
    @import './login.less';
  </style>
  