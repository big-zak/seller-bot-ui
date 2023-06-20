<script setup>
import Utils from "@/classes/Utils"
import Http from "@/classes/Http"
import { onMounted, ref } from "vue"
import OrderDialog from "@/components/dialogs/OrderDialog.vue"
//import { VDataTable } from 'vuetify/labs/VDataTable'
import DataTable from 'datatables.net-vue3';
import DataTablesCore from 'datatables.net';
import 'datatables.net-select';
import 'datatables.net-responsive';
import fromExponential from 'from-exponential';


DataTable.use(DataTablesCore);

const error = ref("")
const dataArray = ref([])
const isLoading = ref(false)
const isDialogOpened = ref(false)
const dataToEdit = ref({})
const uikey = ref(Date.now())
const dialogKey = ref(Date.now)

onMounted(()=>{
  fetchData()

  window.setInterval(() => {
    if(!isDialogOpened.value){
      fetchData()
    }
  }, 30_000)
  
})

const openDialog = () => {
  dataToEdit.value = {}
  isDialogOpened.value = true
  dialogKey.value = ref(Date.now)
}

const handleOnSave = async () => {
  dataToEdit.value = {}
  isDialogOpened.value = false
  fetchData()
}

const onDialogClosed = async () => {
  isDialogOpened.value = false
  dataToEdit.value = {}
}

const fetchData = async () => {
  try {

    error.value = ""
    isLoading.value = true

    let resultStatus = await Http.getApi("/orders")

    //console.log(resultStatus)

    if(resultStatus.isError()){
      let err = (resultStatus.getMessage()) 
                ? resultStatus.getMessage() 
                : Utils.systemErrorMsg
      error.value = err
      return false;
    }

    let resultData = resultStatus.getData()

    dataArray.value = resultData
    
    //console.log("dataArray.value===>", dataArray.value)
    uikey.value = Date.now()

  } catch(e) {
    console.log("index#fetchData:", e, e.stack)
    error.value = Utils.systemErrorMsg
  } finally {
    isLoading.value = false
  }
}

const getCurrentPrice =  item => {
  
  let priceInfo = item.priceInfo || null
  
  if(priceInfo == null){
    return "N/A"
  }

  //console.log("priceInfo===>", priceInfo)
  let price = fromExponential(priceInfo.priceDecimal.$numberDecimal)

  return `${price} ${item.tokenBInfo.symbol}`
}

const getStatus = item => {

  let status;

  if(item.isProcessed){
    let txInfo = item.txInfo
    let txHref = `<a href='${item.explorer}/tx/${txInfo.hash}' target='_blank'>
                    ${Utils.maskAddress(txInfo.hash)}
                  </a>`
    status = "<div class='text-success'>Processed</div>"
    status = `${status}<div><small>${txHref}</small></div>`
  } else if(item.isCancelled){

    status = "Cancelled"
    let error = item.error || ""

    if(error != ""){
      status =  `<div>${status}</div><div>Error: <small class='text-danger'>${error}</small></div>`
    }
  } 
  else {
    if(item.isActive){
      status = "Active"
    } else {
      status = "Disabled"
    }
  }

  return status
}

const editItem = (item) => {
  dataToEdit.value = item
  isDialogOpened.value = true
}

const deleteItem = async (item) => {

  let loader;
  
  try {
    
    let confirmAction = await Utils.getSwal().fire({
      title: "Confirm Deletion",
      text: `Order data will be deleted permanently, press okay to continue`,
      showConfirmButton: true,
      showCancelButton: true
    })

    if(!confirmAction.isConfirmed) return;

    loader =  Utils.loadingModal("Deleting Order", "Deleteing Order Data..")

    let resultStatus = await Http.postApi("/orders/delete", { id: item._id })

    if(resultStatus.isError()){
     
      let errMsg = (resultStatus.getMessage())
                  ? resultStatus.getMessage()
                  : Utils.systemErrorMsg

      loader.close()
      return Utils.notyError(errMsg)
    }

    await fetchData()

    Utils.notySuccess("Order deleted successfully")

  }  catch(e){
      console.log("exchange#deleteItem:", e, e.stack)
      Utils.notyError(Utils.systemErrorMsg)
  } finally {
     if(loader) loader.close()
  }
}
</script>
<template>
  <div :key="uikey">
    <VCard
      class="mb-6"
    >
      <div class="d-flex py-5 px-2 justify-space-between">
        <VCardTitle>Orders</VCardTitle>
        <v-btn
          color="primary"
          rounded="pill"
          prepend-icon="mdi-plus"
          @click.prevent="openDialog"
        >
          Add Order
        </v-btn>
      </div>

      <LoadingView :isLoading="isLoading">

        <div class="px-10 py-15" v-if="error != ''">
          <v-alert color="#C51162" theme="dark" class="text-center" border>{{  error  }}</v-alert>
        </div>

        <div v-else>
          
          <div class="px-10 py-15 text-center" v-if="dataArray.length == 0">
            No Orders Found
          </div>

          <div v-else class="px-5 py-5">
            <DataTable class="display" :options="{responsive: true}">
                <thead>
                    <tr>
                        <th>TokenA</th>
                        <th>TokenB</th>
                        <th>Target Price</th>
                        <th>Current Price</th>
                        <th>Slippage</th>
                        <th>Quantity</th>
                        <th>Exchange</th>
                        <th>Status</th>
                        <th>&nbsp;</th>
                    </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in dataArray" :key="index">
                    <td>
                      <div>{{ item.tokenAInfo.name }} ({{ item.tokenAInfo.symbol }})</div>
                      <div>
                        <a :href="`${item.explorer}/address/${item.tokenA}`" target='blank'>
                          <small class='addr-short'>{{ Utils.maskAddress(item.tokenA) }}</small>
                          <small class='addr-long'>{{ item.tokenA }}</small>
                        </a>
                      </div>
                    </td>
                    <td>
                      <div>{{ item.tokenBInfo.name }} ({{ item.tokenBInfo.symbol }})</div>
                      <div>
                        <a :href="`${item.explorer}/address/${item.tokenB}`" target='blank'>
                          <small class='addr-short'>{{ Utils.maskAddress(item.tokenB) }}</small>
                          <small class='addr-long'>{{ item.tokenB }}</small>
                        </a>
                      </div>
                    </td>
                   
                    <td>{{ item.targetPrice }} {{ item.tokenBInfo.symbol }}</td>
                    <td class="text-info">{{ getCurrentPrice(item) }}</td>
                    <td>{{ item.slippage }}%</td>
                    <td>{{ item.quantity }} {{ item.tokenAInfo.symbol }}</td>
                    <td>
                      <div>{{ item.exchangeName }}</div>
                      <div><small class="text-info">{{ item.chain }}</small></div>
                    </td>
                    <td v-html="getStatus(item)"></td>
                    <td>
                      <div class="d-flex flex-row">
                        <v-icon
                          size="small"
                          class="me-2"
                          @click="editItem(item)"
                        >
                          mdi-pencil
                        </v-icon>
                        <v-icon
                          size="small"
                          @click="deleteItem(item)"
                        >
                          mdi-delete
                        </v-icon>
                      </div>
                    </td>
                  </tr>
                </tbody>
            </DataTable>
          </div>
        </div>
      </LoadingView>
    </VCard>

    <OrderDialog 
      :isOpened="isDialogOpened"
      :data="dataToEdit"
      @close="onDialogClosed"
      @save="handleOnSave"
      :key="dialogKey"
    /> 


  </div>
</template>
<style lang="scss">
  @import 'datatables.net-dt';
  @import '../assets/dataTables.material.min.css';

  td {
    .addr-long{ display: none; }
    .addr-short{ display: inline-block; }

    &:hover {
      .addr-short { display: none; }
      .addr-long{ display: inline-block; }
    }
  }
</style>