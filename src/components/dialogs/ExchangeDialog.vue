<script setup>

import Http from "@/classes/Http"
import Utils from "@/classes/Utils"
import LoadingView from "@/layouts/LoadingView.vue"
import { onBeforeMount } from "vue"
import { watch } from "vue"
import { ref, onUpdated, onMounted } from "vue"

const props = defineProps({ 
    isOpened: { type: Boolean, default: false },
    data: { type: Object, default: {} }
})

const $emits = defineEmits(["close", "save"])

const dialogOpened = ref(props.isOpened)
const formData = ref({
    _id: "",
    name:  "",
    router: "",
    chain: "",
    isActive:  true
})

const chainsArray = ref([])
const isLoading = ref(false)
const isInitialing = ref(false)
const initError = ref("")

onMounted(()=> {
    initialize()
})

onUpdated(()=>{
    
    if(props.isOpened != dialogOpened.value){
        dialogOpened.value = props.isOpened
    }

    if(dialogOpened.value){
        populateData()
    }
})

watch(dialogOpened, () => {
    if(!dialogOpened.value){
        $emits("close")
    }
})

const populateData = () => {
    let d = props.data;
    if(Object.keys(d).length > 0){

        let newData = {...formData.value, ...d}
        formData.value = newData
    }
}

const initialize = async () => {
    try {

        if(chainsArray.value.length > 0){
            return true
        }

        initError.value = ""    
        isInitialing.value = true
        
        let resultStatus = await Http.getApi("/fetch-chains")

        if(resultStatus.isError()){
            initError.value = resultStatus.getMessage()
            return false;
        }

        chainsArray.value = resultStatus.getData() || []
    } catch(e){
        console.log("ExchangeDialog#initialize:", e, e.stack)
        initError.value = Utils.systemErrorMsg
    } finally {
        isInitialing.value = false
    }
}

const submit = async () => {
    try {

        let fData = formData.value

        if(fData.name.trim() == ""){
            return Utils.notyError("Exchange name is required")
        }

        /*if(!Utils.isEthAddress(fData.factoryAdress)){
            return Utils.notyError("A valid factory address is required")
        }*/

        if(!Utils.isEthAddress(fData.router)){
            return Utils.notyError("A valid router address is required")
        }

        if(fData.chain.trim() == ""){
            return Utils.notyError("A valid chain is required")
        }

        isLoading.value = true 

        let resultStatus = await Http.postApi("/exchanges/save", fData)

        if(resultStatus.isError()){
            let err = (resultStatus.getMessage())
                    ? resultStatus.getMessage() 
                    : Utils.systemErrorMsg
            return Utils.notyError(err)
        }

        $emits("save", fData)

        dialogOpened.value = false 
        
    } catch(e){
        console.log("ExchangeDialog#submit:", e, e.stack)
        Utils.notyError(Utils.systemErrorMsg)
    } finally {
        isLoading.value = false
    }
}


</script>

<template>
    <v-dialog
      v-model="dialogOpened"
      :width="460"
      max-width="100%"
      :top="10"
      transition="dialog-top-transition"
      scrollable
    >
        <v-card>
            <div class="d-flex justify-space-between my-3 mx-3">
                <v-card-title>
                    Add Exchange
                </v-card-title>
                <v-btn  
                    density="comfortable" 
                    color="info" 
                    icon="mdi-close"
                    @click="dialogOpened = false"
                    variant ='outlined'
                ></v-btn>
            </div>
            <v-card-text>
                <loading-view :is-loading="isInitialing">

                    <div v-if="initError != ''">
                        <v-alert color="danger">
                            {{ initError }}
                        </v-alert>
                    </div>
                    <v-form v-else>
                        <div class="my-5" v-if="formData._id != ''">
                            <v-text-field
                                :model-value="formData._id"
                                label="ID"
                                required
                                disabled
                                readonly
                            ></v-text-field>
                        </div>
                        <div class="my-5">
                            <v-text-field
                                v-model="formData.name"
                                label="Exchange Name"
                                required
                            ></v-text-field>
                        </div>
                        <div class="my-5">
                            <v-text-field
                                v-model="formData.router"
                                label="Router Address"
                                required
                            ></v-text-field>
                        </div>
                        <!---div class="my-5">
                            <v-text-field
                                v-model="formData.factoryAddress"
                                label="Factory Address"
                                required
                            ></v-text-field>
                        </div>-->
                        <div class="my-5">
                            <v-select
                                v-model="formData.chain"
                                :items="chainsArray"
                                label="Select Chain"
                                density="comfortable"
                            ></v-select>
                        </div>
                        <div>
                            <v-checkbox
                                v-model="formData.isActive"
                                label="isActive"
                                color="primary"
                                hide-details
                            ></v-checkbox>
                        </div>
                        <div class="my-5">
                            <v-btn 
                                color="info" 
                                block 
                                :disabled="isLoading"
                                :loading="isLoading"
                                variant="flat"
                                @click.prevent="submit"
                            >Save</v-btn>
                        </div>
                    </v-form>
                </loading-view>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>