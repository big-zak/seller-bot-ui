<script setup>
import { VForm } from 'vuetify/components/VForm'
//import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import LoadingView from "../layouts/LoadingView.vue"
import Utils from "../classes/Utils"
//import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
//import { themeConfig } from '@themeConfig'
//import isEmail from 'validator/lib/isEmail';
import Http from "../classes/Http"
import { useRouter } from 'vue-router'

const authThemeImg = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)
const isPasswordVisible = ref(false)
const refVForm = ref()
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading  = ref(false)
const router = useRouter()

const handleLogin = async () => {

  try {

    if(username.value.trim() == ""){
      return Utils.notyError("Username is required")
    }

    if(password.value.trim() == ""){
      return Utils.notyError("Password is required")
    }

    let params = { "username": username.value, "password": password.value }

    isLoading.value = true 

    let resultStatus = await Http.postApi("/login", params)

    //console.log("resultStatus===>", resultStatus)

    if(resultStatus.isError()){
      return Utils.notyError(resultStatus.getMessage())
    }

    let data = resultStatus.getData()

    let sessionData = JSON.stringify({ 
      username: username.value, 
      sessionId: data.sessionId 
    })

    //lets save the auth info
    window.sessionStorage.setItem("auth_info", sessionData)

    isLoading.value = false

    Utils.mAlert(resultStatus)

    router.push("/")

  } catch(e){
    console.log(e)
    Utils.notyError(Utils.systemErrorMsg)
  } finally {
    isLoading.value = false
  }

}
</script>

<template>
  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      lg="8"
      class="d-none d-lg-flex"
    >
      <div class="position-relative bg-background rounded-lg w-100 ma-8 me-0">
        <div class="d-flex align-center justify-center w-100 h-100">
          <VImg
            max-width="505"
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
          />
        </div>

        <VImg
          :src="authThemeMask"
          class="auth-footer-mask"
        />
      </div>
    </VCol>

    <VCol
      cols="12"
      lg="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        max-width="100%"
        :width="500"
        class="mt-12 mt-sm-0 pa-4"
      >
        <LoadingView :isLoading="isLoading" size="md"> 
          <VCardText>
      
            <h5 class="text-h5 mb-1">
              Welcome! 👋🏻
            </h5>

            <p class="mb-0">
              Please sign-in to your account
            </p>
          </VCardText>

        
          <VCardText>
            <VForm
              ref="refVForm"
              @submit="() => { }"
            >
              <VRow>
                <!-- email -->
                <VCol cols="12">
                  <AppTextField
                    v-model="username"
                    label="Username"
                    type="text"
                    autofocus
                  />
                </VCol>

                <!-- password -->
                <VCol cols="12">
                  <AppTextField
                    v-model="password"
                    label="Password"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                    @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  />

                  <VBtn
                    block
                    type="button"
                    class="mt-5"
                    @click.prevent="handleLogin"
                  >
                    Login
                  </VBtn>
                </VCol>

              </VRow>
            </VForm>
          </VCardText>
        </LoadingView>

      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>

<route lang="yaml">
meta:
  layout: blank
</route>
