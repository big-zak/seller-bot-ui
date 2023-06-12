import Http from '@/classes/Http'
import Utils from '@/classes/Utils'
import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '~pages'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...setupLayouts(routes),
  ],
})


/*/ lets handle auth
router.beforeResolve( async (to, from, next) => {
  
  try {
  //console.log("hmmm===>", to)

  if(to.path == "/login") return next()

    let authInfo = (sessionStorage.getItem("auth_info") || "").trim()
   
    if(authInfo == ""){
      return next("/login")
    }

    let authInfoJson = JSON.parse(authInfo)

    let isValidAuth = await processIsValidAuth(authInfoJson)

    if(!isValidAuth) return next("/login")

    return next()
  } catch(e){
     console.log("router#beforeResolve:", e, e.stack)
     next("/login")
  }

})
*/

const processIsValidAuth = async (authInfo) => {
  try {

    let resultStatus = await Http.postApi("/validate-auth", authInfo)
    
    if(resultStatus.isError()){
      Utils.notyError(resultStatus.getMessage())
      return false;
    }

    let resultData = resultStatus.getData() || { isValid: false }

    return resultData.isValid;

  } catch(e){
    console.log("router#validateAuth:", e, e.stack)
    Utils.notyError(Utils.systemErrorMsg)
    return false
  }
}

// Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
export default router
