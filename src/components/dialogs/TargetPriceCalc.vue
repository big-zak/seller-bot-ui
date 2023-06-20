<script setup>

import Http  from "@/classes/Http"
import Utils from "@/classes/Utils"
import LoadingView from "@/layouts/LoadingView.vue"
import { onBeforeMount } from "vue"
import { watch } from "vue"
import { ref, onUpdated, onMounted } from "vue"
import { ethers } from "ethers"

const props = defineProps({ 
    isOpened: { type: Boolean, default: false },
    data: { type: Object, default: {} }
})

const $emits = defineEmits(["close", "save"])
const dialogOpened = ref(props.isOpened)
const isPageLoading = ref(false)
const pageError = ref("")
const priceInfo = ref(null)
const tokenAInfo = ref(null)
const tokenBInfo = ref(null)
const multiplier = ref(1)
const targetPrice = ref("0")

const multipliersArray = ref([1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100])

const FN = (_val) => ethers.FixedNumber.fromString(_val.toString())


onUpdated(()=>{
    
    if(props.isOpened != dialogOpened.value){
        dialogOpened.value = props.isOpened
    }

    if(dialogOpened.value){
        initialize()
    }
})

watch(dialogOpened, () => {
    if(!dialogOpened.value){
        $emits("close")
    }
})

const initialize = async () => {
    try {

        pageError.value = ""

        //lets validate data
        let _d = props.data 

        let exchangeId  = _d.exchangeId 
        let tokenA      = _d.tokenA 
        let tokenB      = _d.tokenB 

        if(exchangeId.trim() == ""){
            pageError.value = ("kindly select a valid exchange")
            return;
        }

        if(!Utils.isEthAddress(tokenA)){
            pageError.value = ("A valid tokenA address is required")
            return;
        }

        if(!Utils.isEthAddress(tokenB)){
            pageError.value = ("A valid tokenB address is required")
            return;
        }

        let params = { exchangeId, tokenA, tokenB }

        isPageLoading.value = true
        let resultStatus = await Http.getApi("/fetch-asset-price", params)

        //console.log("resultStatus===>", resultStatus)

        if(resultStatus.isError()){
            let err = (resultStatus.getMessage())
                    ? resultStatus.getMessage() 
                    : Utils.systemErrorMsg
            pageError.value = err
            return false 
        }

        let resultData = resultStatus.getData()
        
        priceInfo.value  = resultData.priceInfo;
        tokenAInfo.value = resultData.tokenAInfo;
        tokenBInfo.value = resultData.tokenBInfo;

        //console.log(resultData) 
        computeTargetPrice()

    } catch(e){
        console.log("TargetPriceCalc#initialize:",e, e.stack)
        pageError.value = Utils.systemErrorMsg
    } finally {
        isPageLoading.value = false
    }
}

const handleNumberInput = e => {
    //console.log(e.target.value)
    if(e.key == "."){
        if(e.target.value.includes(".")){
            e.preventDefault()
        }
    } else if(!/([0-9]+)/g.test(e.key)) {
        e.preventDefault()
    } 
}

watch(multiplier, () => {
    computeTargetPrice()
})

const computeTargetPrice = () => {
    if(priceInfo.value == null) return 
    //console.log("priceInfo.value.priceDecimals===>", priceInfo.value.priceDecimals)
    //console.log("multiplier===>>>", multiplier.value)
    targetPrice.value = (FN(priceInfo.value.priceDecimals).mul(FN(multiplier.value))).toString()
}

const handleSave = () => {
    $emits("save", targetPrice.value)
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
                    Target Price Calculator
                </v-card-title>
                <v-btn  
                    density="comfortable" 
                    color="info" 
                    icon="mdi-close"
                    @click="dialogOpened = false"
                    variant ='outlined'
                ></v-btn>
            </div>
            <div class="d-flex justify-space-between my-3 mx-3 py-5 full-width">
                <loading-view :isLoading="isPageLoading" class="full-width pe-6">
                    <div v-if="pageError != ''">
                        <v-alert 
                            color="#C51162" 
                            theme="dark" 
                            class="text-center b-alert" 
                            border       
                            density="compact"
                            variant="tonal"
                            width="90%" 
                        >
                            {{  pageError  }}
                        </v-alert>
                    </div>
                    <div v-else>
                        <v-text-field
                            :model-value="priceInfo.priceDecimals"
                            label="Asset Price"
                            type="text"
                            pattern="[0-9\.]+"
                            @keypress="handleNumberInput"
                            
                            :readonly="true"
                            class="text-dark"
                        ></v-text-field>
                        <div class="my-5">
                            <v-row>
                                <v-col xs="6" lg="8">
                                    <v-select
                                        :items="multipliersArray"
                                        v-model="multiplier"
                                        density="compact"
                                        label="Multiplier"
                                    ></v-select>
                                </v-col>
                                <v-col>
                                    <v-text-field
                                        v-model="multiplier"
                                        label="Custom"
                                        type="number"
                                        class="text-dark"
                                    ></v-text-field>
                                </v-col>
                            </v-row>
                        </div>
                        <div>
                            <v-text-field
                                :model-value="targetPrice"
                                label="Target Price (Multiplier * Price)"
                                type="text"
                                pattern="[0-9\.]+"
                                @keypress="handleNumberInput"
                                class="text-dark"
                            ></v-text-field>
                        </div>
                        <div class="py-5">
                            <v-btn block color="info" elevation="8" @click.prevent="handleSave">
                                Save
                            </v-btn>
                        </div>
                    </div>
                </loading-view>
            </div>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
.b-alert { width: 100% !important; }
</style>