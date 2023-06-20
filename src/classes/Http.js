
import Status from "./Status"
import appConfig from "../config/app"
import { fetch as fetchPolyfill } from "whatwg-fetch"
//import AuthCore from "./AuthCore"
import Utils from "./Utils"
//import AppData from "./AppData"

export default class Http {

    static async loadPolyfill(){
        if(!("fetch" in window)){
            window["fetch"] = fetchPolyfill
        }
    }

    /**
     * http get
     * @param {string} url 
     * @param {Object} data 
     * @param {Object} headers 
     */
    static async get(url,data = {}, headers = {}){
        url += (url.indexOf('?') === -1 ? '?' : '&') + this.queryParams(data);
        return this.request(url,{headers})
    } //end fun

    /**
     * @param {*} uri 
     * @param {*} data 
     * @param {*} hasAuth 
     */
    static async requestApi( method, uri, data={}, requiresAuth = false){

        uri = uri.replace(/^(\/+)/, "")

       // console.log("uri===>", uri)
                
        let headers = {"x-key": appConfig.apiKey}
       
        if(!/^(login|validate\-auth)/i.test(uri)){
            
            //console.log("not auth uri")
            let authInfoStr = (window.sessionStorage.getItem("auth_info") || "").trim()

            if(authInfoStr == ""){
                Utils.notyError("Login Required")
                 window.location = "/login"
                return Status.error("login_required") 
            }

            try {

                let authInfo = JSON.parse(authInfoStr)

                let {username, sessionId} = authInfo;

                headers["x-username"]          = username;
                headers["x-session-id"]        = sessionId;
                
            } catch(e){
                Utils.notyError("Login Required")
                window.location = "/login"
                return false 
            }
        }
   
        let apiEndpoint = appConfig.apiEndpoint
                            .replace(/(\/+)$/, "")

       // console.log("apiEndpoint===>", apiEndpoint)

        let url = `${apiEndpoint}/${uri}`;

        
        try {

            let reqStatus = await ((method == "post") 
                            ? this.post(url, data, headers) 
                            : this.get(url, data, headers))

            if(reqStatus.isError()) return reqStatus

            let responseObj = reqStatus.getData()

            let respBody =  (await responseObj.text() || "").trim();

            let respJson = (respBody.length ==  0) 
                                ? {} 
                                : JSON.parse(respBody)

            let statusMsg = respJson.message || ""

            //console.log(statusMsg)

            if(statusMsg == "login_required"){
                Utils.notyError("Login Required")
                window.location = "/login"
                return Status.errorPromise("login_required") 
            }

            if(statusMsg.toLowerCase() == "system_busy"){
                respJson.message = Utils.generalErrorMsg
            }
            
            if("type" in respJson && "data" in respJson){ 
                return Promise.resolve(Status.newStatus(respJson))
            }


            return Status.successPromise("", respJson)

        } catch (e) {
            console.error(`requestApi Error: ${url}`,e)
            return Status.errorPromise(Utils.generalErrorMsg)
        }
            
    }


    static async getApi(uri, data={}, requiresAuth = false){
        return  this.requestApi("get", uri, data, requiresAuth);
    }


    static async postApi(uri, data={}, requiresAuth = false){
        return  this.requestApi("post", uri, data, requiresAuth);
    }

    /**
     * getJson
     * @param {*} url 
     * @param {*} data 
     * @param {*} headers 
     */
    static async getJson(url, data = {}, headers = {}){
        try {

            let reqStatus = await this.get(url,data,headers)

            if(reqStatus.isError()) return reqStatus

            let responseObj = reqStatus.getData()

            //console.log("responseObj===>>>", responseObj)

            let respBody =  (await responseObj.text()).trim();

            let respJson = (respBody.length ==  0) ? {} : JSON.parse(respBody)

            return Status.successPromise(null, respJson)

        } catch (e) {
            console.error(`getJson Error: ${url}`,e)
            return Status.errorPromise("REQUEST_FAILED",e)
        }
    } //end fun
 
    /**
     * http post
     * @param {*} url 
     * @param {*} data 
     * @param {*} headers 
     */
    static async post(url,data = {}, headers = {}){

        //let formData = new FormData()
        let formData = new URLSearchParams(data)
      
        return this.request(url,{
            method: "POST",
            body: formData,
            headers
        })
    } //end fun 

    /**
     * queryParams
     * @param {*} params 
     */
    static queryParams(params) {
       let ec = encodeURIComponent;
        return Object.keys(params).map(k => ec(k) + '=' + ec(params[k])).join('&');
    }

    /**
     * request
     * @param {*} url 
     * @param {*} params 
     */
    static async request(url,params){

        let rparams = {
            ...{
                "credentials": 'include',
                "redirect": "follow"
            },
            ...params
        }
       
        try {

            this.loadPolyfill();

            let response = await window.fetch(url,rparams);


            return Status.successPromise(null, response)

        } catch(e){
            console.error(`request Error: ${url}`,e)
            return Status.errorPromise("REQUEST_FAILED")
        }
    } //end 

 }
