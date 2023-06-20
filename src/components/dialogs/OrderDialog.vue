<script setup>

import Http from "@/classes/Http"
import Utils from "@/classes/Utils"
import LoadingView from "@/layouts/LoadingView.vue"
import TargetPriceCalc from "./TargetPriceCalc.vue"
import { onBeforeMount } from "vue"
import { watch } from "vue"
import { ref, onUpdated, onMounted } from "vue"

const props = defineProps({ 
    isOpened: { type: Boolean, default: false },
    data: { type: Object, default: {} }
})

const $emits = defineEmits(["close", "save"])

const defaultForm = {
    _id: "",
    tokenAddressA:  "",
    tokenAddressB:  "",
    quantity:       "0.0",
    orderType:      "sell",
    targetPrice:    "0.0",
    exchangeId:     "",
    slippage:       0.5,
    isActive:       true,
    supportsFeeOnTransfer: false
}

const dialogOpened = ref(props.isOpened)
const formData = ref(defaultForm)

const exchangesArray = ref([])
const isLoading      = ref(false)
const isInitialing   = ref(false)
const initError      = ref("")
const isTargetPriceDialogOpened = ref(false)

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

    //console.log("d===>>", d)

    if(Object.keys(d).length > 0){

        let newData = {...formData.value, ...d}
        formData.value = newData
    }
}

const initialize = async () => {
    try {

        if(exchangesArray.value.length > 0){
            return true
        }

        initError.value = ""    
        isInitialing.value = true
        
        let resultStatus = await Http.getApi("/exchanges")

        if(resultStatus.isError()){
            initError.value = resultStatus.getMessage()
            return false;
        }

        let resultData = resultStatus.getData() || []
        
        for(let index in resultData){
            let item = resultData[index]
            if(!item.isActive) continue;
            item.nameWithChain = `${item.name} - ${item.chain}`
            resultData[index] = item
        }

        exchangesArray.value = resultData

    } catch(e){
        console.log("OrderDialog#initialize:", e, e.stack)
        initError.value = Utils.systemErrorMsg
    } finally {
        isInitialing.value = false
    }
}

const submit = async () => {
    try {

        let fData = formData.value

        if(!Utils.isEthAddress(fData.tokenA)){
            return Utils.notyError("A valid tokenA address is required")
        }

        if(!Utils.isEthAddress(fData.tokenB)){
            return Utils.notyError("A valid tokenB address is required")
        }

        if(fData.exchangeId.trim() == ""){
            return Utils.notyError("kindly select a valid exchange")
        }


        if(!["sell"].includes(fData.orderType)){
            return Utils.notyError("Invalid order type")
        }

        if(parseFloat(fData.targetPrice) <= 0){
            return Utils.notyError("Target price must exceed 0")
        }

        if(parseFloat(fData.quantity) <= 0){
            return Utils.notyError("Quantity of tokenA to sell must exceed 0")
        }


        if(fData.slippage < 0 || fData.slippage > 100){
            return Utils.notyError("Slippage should be betewwn 0 - 100")
        }

        isLoading.value = true 

        let resultStatus = await Http.postApi("/orders/save", fData)

        if(resultStatus.isError()){
            let err = (resultStatus.getMessage())
                    ? resultStatus.getMessage() 
                    : Utils.systemErrorMsg
            return Utils.notyError(err)
        }

        $emits("save", fData)

       dialogOpened.value = false 
        
    } catch(e){
        console.log("OrderDialog#submit:", e, e.stack)
        Utils.notyError(Utils.systemErrorMsg)
    } finally {
        isLoading.value = false
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

const onTargetPriceSave = (value) => {
    formData.value.targetPrice = value.toString()
    isTargetPriceDialogOpened.value = false
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
                    <template v-if="formData._id != ''">
                        Update Order
                    </template>
                    <template v-else>
                        Add Order
                    </template>
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
                            <v-select
                                v-model="formData.orderType"
                                :items="['sell']"
                                label="Select Order Type"
                                density="comfortable"
                            ></v-select>
                        </div>
                        <div class="my-5">
                            <v-select
                                v-model="formData.exchangeId"
                                :items="exchangesArray"
                                label="Select Exchange"
                                density="comfortable"
                                item-title="nameWithChain"
                                item-value="_id"
                            ></v-select>
                        </div>
                        <div class="my-5">
                            <v-text-field
                                v-model="formData.tokenA"
                                label="TokenA (token to sell contract)"
                                required
                            ></v-text-field>
                        </div>
                        <div class="my-5">
                            <v-text-field
                                v-model="formData.tokenB"
                                label="TokenB (token to buy contract)"
                                required
                            ></v-text-field>
                        </div>

                        <div class="my-5">
                            <v-slider
                                v-model="formData.slippage"
                                class="align-center"
                                :max="100"
                                :min="0"
                                label="Slippage %"
                                thumb-label="always"
                                hide-details
                            >
                                <template v-slot:append>
                                    <v-text-field
                                        v-model="formData.slippage"
                                        hide-details
                                        single-line
                                        density="compact"
                                        :min="0"
                                        :max="100"
                                        type="number"
                                        style="width: 80px"
                                    ></v-text-field>
                                </template>
                            </v-slider>
                        </div>
                        <div>
                            <v-checkbox
                                v-model="formData.supportsFeeOnTransfer"
                                label="Has Transfer Tax?"
                                color="primary"
                                hide-details
                            ></v-checkbox>
                        </div>
            
                        <div class="my-5">
                            <div class="d-flex">
                                <v-text-field
                                    v-model="formData.targetPrice"
                                    label="Target Price"
                                    required
                                    type="text"
                                    pattern="[0-9\.]+"
                                    @keypress="handleNumberInput"
                                ></v-text-field>
                                <div class="ps-2">
                                    <v-btn 
                                        icon="mdi-calculator" 
                                        size="small"
                                        @click.prevent="isTargetPriceDialogOpened = true" 
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="my-5">
                            <v-text-field
                                v-model="formData.quantity"
                                label="TokenA quantity to sell"
                                required
                                type="text"
                                pattern="[0-9\.]+"
                                @keypress="handleNumberInput"
                            ></v-text-field>
                        </div>
                        <div>
                            <v-checkbox
                                v-model="formData.isActive"
                                label="isActive"
                                color="primary"
                                hide-details
                            ></v-checkbox>
                        </div>
                        <div v-if="('isProcessed' in formData) && formData.isProcessed == true">
                            <v-checkbox
                                v-model="formData.isProcessed"
                                label="isProcessed"
                                color="primary"
                                hide-details
                            ></v-checkbox>
                        </div>
                        <div v-if="('isCancelled' in formData) && formData.isCancelled == true">
                            <v-checkbox
                                v-model="formData.isCancelled"
                                label="isCancelled"
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
        <TargetPriceCalc
            :isOpened="isTargetPriceDialogOpened"
            @close="isTargetPriceDialogOpened = false"
            :data="formData"
            @save="onTargetPriceSave"
        />
    </v-dialog>
</template>